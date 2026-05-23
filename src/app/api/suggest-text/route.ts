import { NextResponse } from "next/server";
import { z } from "zod";
import { callOpenRouter, MODELS } from "@/lib/openrouter";
import { TEMPLATES, TEMPLATE_BY_ID } from "@/lib/templates";

export const runtime = "nodejs";
export const maxDuration = 60;

const GRADIENTS = [
  "linear-gradient(135deg, #1a1a16 0%, #2a2f3f 100%)",
  "linear-gradient(135deg, #14140e 0%, #3a3f2a 100%)",
  "linear-gradient(135deg, #1f0d0d 0%, #ff5436 220%)",
  "linear-gradient(135deg, #0c0c0a 0%, #c6f24e 320%)",
  "linear-gradient(135deg, #15150f 0%, #4a3a1a 100%)",
  "linear-gradient(135deg, #0a0a14 0%, #6e3aff 220%)",
  "linear-gradient(135deg, #1a1010 0%, #2a4a3a 100%)",
];

const SuggestionSchema = z.object({
  template_id: z.string(),
  captions: z.record(z.string(), z.string()),
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

Output strict JSON, no prose:
{
  "suggestions": [
    {
      "template_id": "<id from list>",
      "captions": { "<slot_key>": "<text>", ... },
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
  return { template_id: s.template_id, captions, why: s.why ?? "" };
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
    }> = [];
    for (const s of validated.suggestions) {
      if (seen.has(s.template_id)) continue;
      const c = clampSuggestion(s);
      if (!c) continue;
      const g = GRADIENTS[cleaned.length % GRADIENTS.length];
      seen.add(c.template_id);
      cleaned.push({ ...c, background: g });
      if (cleaned.length >= 6) break;
    }

    return NextResponse.json({ topic, suggestions: cleaned });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
