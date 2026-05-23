import { NextResponse } from "next/server";
import { z } from "zod";
import { callOpenRouter, MODELS } from "@/lib/openrouter";
import { TEMPLATES, TEMPLATE_BY_ID } from "@/lib/templates";

export const runtime = "nodejs";
export const maxDuration = 60;

function pollinationsUrl(prompt: string, seed: number): string {
  // Free image-gen endpoint backed by Flux. Caches by URL.
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=768&height=768&model=flux&nologo=true&enhance=true&seed=${seed}`;
}

const SuggestionSchema = z.object({
  template_id: z.string(),
  captions: z.record(z.string(), z.string()),
  image_prompt: z.string().min(4),
  why: z.string().optional(),
});

const ResponseSchema = z.object({
  suggestions: z.array(SuggestionSchema).min(4),
});

function buildSystemPrompt() {
  const templateLines = TEMPLATES.map((t) => {
    const slots = t.slots.map((s) => `"${s.key}"`).join(", ");
    return `- ${t.id}: ${t.name}. ${t.vibe} Slots: ${slots}.`;
  }).join("\n");

  return `You are a meme writer. The user types a topic or situation — NO photo. Write six memes about it that actually land for an Indian audience (Hyderabad-leaning, tech-adjacent, May 2026).

Hard rules:
1. Captions must be SPECIFIC to the topic. Generic "When you..." captions die.
2. Funny > clever > earnest. We are not writing inspirational quotes.
3. No emojis. No hashtags. No exclamation marks unless the joke truly needs one.
4. Six suggestions, six DIFFERENT template_ids.
5. At least two suggestions should lean Indian/Hyderabadi when the topic supports it (don't force).

Cultural cues you can reach for when they fit:
- Hyderabad slang sparingly: hau, nakko, bawa, miya, baigan, "light lo", "haalat aisi hai ki [X]", "wo wala feeling jab [X]".
- Dev humor: ".ai startups that are actually Indian devs", LinkedIn cringe ("humbled to announce"), service-vs-product, ChatGPT/Cursor coping.
- May 2026 topical: Cockroach Janta Party (CJI called unemployed youth "cockroaches" → 19M followers), IPL playoffs (SRH beat RCB by 55 at home May 22), engineering grad unemployment.
- Evergreen: Sharma ji ka beta, shaadi, aunty gossip, cricket, monsoon.

What's cringe — auto-fail:
- Stacking "yaar"/"bhai" every line.
- "Indian moms be like".
- More than one Hindi/Urdu phrase per caption.
- Forcing Hyderabad refs on a topic that has nothing to do with Hyderabad.

Available templates (use id verbatim):
${templateLines}

For EACH suggestion, also write an image_prompt — a short visual description (10-18 words) of a *photographic* AI-generated background image that complements the caption WITHOUT containing any text or words. Style cues that work: cinematic lighting, dramatic shadows, shallow depth of field, moody color grading, photoreal. The image should leave the upper or lower third relatively empty so caption typography sits cleanly. Avoid logos, faces of real people, and anything readable.

Output strict JSON, no prose:
{
  "suggestions": [
    {
      "template_id": "<id from list>",
      "captions": { "<slot_key>": "<text>", ... },
      "image_prompt": "<10-18 words, no text in image>",
      "why": "<one sentence>"
    }
  ]
}`;
}

function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first >= 0 && last > first) return raw.slice(first, last + 1);
  return raw.trim();
}

function clampSuggestion(s: z.infer<typeof SuggestionSchema>) {
  const tpl = TEMPLATE_BY_ID[s.template_id];
  if (!tpl) return null;
  const captions: Record<string, string> = {};
  for (const slot of tpl.slots) {
    const v = s.captions[slot.key];
    if (typeof v === "string" && v.trim().length > 0) {
      // Generous buffer — the renderer handles overflow.
      captions[slot.key] = v.trim().slice(0, (slot.maxChars ?? 200) + 80);
    } else if (slot.defaultText) {
      captions[slot.key] = slot.defaultText;
    } else {
      captions[slot.key] = "";
    }
  }
  return {
    template_id: s.template_id,
    captions,
    image_prompt: s.image_prompt.trim().slice(0, 220),
    why: s.why ?? "",
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { topic?: string } | null;
  const topic = body?.topic?.trim();
  if (!topic) {
    return NextResponse.json({ error: "topic required" }, { status: 400 });
  }
  if (topic.length > 500) {
    return NextResponse.json({ error: "topic too long" }, { status: 400 });
  }

  try {
    const raw = await callOpenRouter({
      model: MODELS.sonnet,
      max_tokens: 1500,
      temperature: 0.95,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: `Topic: ${topic}\n\nWrite six memes about this. JSON only.` },
      ],
    });

    const parsed = JSON.parse(extractJSON(raw));
    const validated = ResponseSchema.parse(parsed);

    const seen = new Set<string>();
    const cleaned: Array<{
      template_id: string;
      captions: Record<string, string>;
      why: string;
      background: string;
      image_prompt: string;
    }> = [];
    for (const s of validated.suggestions) {
      if (seen.has(s.template_id)) continue;
      const c = clampSuggestion(s);
      if (!c) continue;
      // Deterministic seed per topic + index so the same topic stays consistent and Pollinations can cache.
      const seed =
        Math.abs([...topic + c.template_id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 0)) % 1_000_000;
      const background = pollinationsUrl(c.image_prompt, seed);
      seen.add(c.template_id);
      cleaned.push({ ...c, background });
      if (cleaned.length >= 6) break;
    }

    return NextResponse.json({ topic, suggestions: cleaned });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
