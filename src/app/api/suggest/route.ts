import { NextResponse } from "next/server";
import { z } from "zod";
import { callOpenRouter, MODELS } from "@/lib/openrouter";
import { TEMPLATES, TEMPLATE_BY_ID } from "@/lib/templates";

export const runtime = "nodejs";
export const maxDuration = 60;

const SuggestionSchema = z.object({
  template_id: z.string(),
  captions: z.record(z.string(), z.string()),
  why: z.string(),
});

const ResponseSchema = z.object({
  observations: z.array(z.string()).min(1),
  suggestions: z.array(SuggestionSchema).min(4),
});

function buildSystemPrompt() {
  const templateLines = TEMPLATES.map((t) => {
    const slots = t.slots.map((s) => `"${s.key}"`).join(", ");
    return `- ${t.id}: ${t.name}. ${t.vibe} Slots: ${slots}.`;
  }).join("\n");

  return `You are a meme writer who writes memes that actually land for an Indian audience — Hyderabad-leaning, tech-adjacent, May 2026. People will look at the photo and read your captions side by side. Make them laugh out loud.

Hard rules — break any and the meme dies:
1. The caption must reference something specifically visible in THIS photo. No generic captions that would work on any photo. If you can swap the photo and the caption still works, the caption is wrong.
2. Funny > clever > earnest. We are not writing inspirational quotes. We are writing memes.
3. Specificity > abstraction. "the third tab in the bottom row of my brain" beats "my thoughts".
4. No "When you..." or "POV:" unless it genuinely makes it funnier. They are crutches.
5. No emojis in captions. No hashtags. No exclamation marks unless the joke truly needs one.
6. Each suggestion must use a DIFFERENT template_id. Six suggestions = six different templates.
7. At least TWO of the six suggestions should lean Indian/Hyderabadi — but only when the photo's vibe genuinely supports it. Forcing it = cringe = meme dies. The other four can be universal.

Cultural toolkit — reach for these when the photo earns them, never when it doesn't:
- Hyderabad slang (use one per caption max, never stacked): hau (yes), nakko (no), bawa (bro/dad), miya (mate), baigan (catch-all "stop it"), light lo (chill).
- Code-switch lines that hit: "bawa, light lo", "kya re miya", "haalat aisi hai ki [X]", "wo wala feeling jab [X]", "nakko karre, full waste", "hau hau, but [X]", "isme galti meri thi?", "pure mood off karaake rakh diya".
- Local references when they fit: Charminar tourist chaos, ORR traffic, HITEC vs Old City, Paradise/Bawarchi biryani arguments, Irani chai + Osmania, Cafe Niloufer.
- Dev humor that hits in 2026: ".ai" startups that are actually just Indian devs writing if/else, service-vs-product company beef, LinkedIn cringe ("humbled to announce", "founder mode"), ChatGPT/Cursor coping.
- Evergreen Indian cues — use only with a fresh angle: Sharma ji ka beta, mom's slipper, shaadi/biodata pressure, aunty gossip energy, "beta engineer banoge".
- Current topicals — if the photo wants it: IPL 2026 playoffs (SRH beat RCB by 55 at home May 22, RCB first to qualify), monsoon onset, board-exam results dropping, the penguin-walking-toward-Charminar/biryani meme.

What is cringe — auto-fail if you do this:
- Stacking "yaar", "bhai" on every line.
- "Indian moms be like…" generic.
- Stereotyped AI-Indian-man tropes — that's the joke people clown now.
- "Namaste from India" energy.
- Translating Indian idioms literally into English. Keep them in Hindi/Urdu when used.
- More than one Hindi/Urdu phrase per caption (it reads as performance).
- Hyderabad references on a photo that has nothing to do with Hyderabad — forced is worse than absent.

Rhythm: short hitters (5–8 words) for Impact templates. Twitter-screenshot energy (12–25 words) for caption-above and screenshot-quote. Contrast — small vs big, expected vs actual, polite vs unhinged — drives the laugh.

Available templates (use template_id verbatim):
${templateLines}

Output strict JSON matching exactly this schema, no prose:
{
  "observations": [string, ...],     // 3-5 specific things you actually see in the photo (subject, expression, setting, props, vibe)
  "suggestions": [                    // 6 entries, each a different template_id
    {
      "template_id": "<one of the ids above>",
      "captions": { "<slot_key>": "<text>", ... },  // keys must match the template's slot keys exactly
      "why": "<one sentence: what in the photo makes this caption land>"
    }
  ]
}`;
}

const USER_PROMPT =
  "Here is the photo. Write six memes that are *about this photo*. JSON only.";

function extractJSON(raw: string): string {
  // Strip ```json fences if present.
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Otherwise find the first { ... } block.
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
      captions[slot.key] = v.trim().slice(0, (slot.maxChars ?? 200) + 20);
    } else if (slot.defaultText) {
      captions[slot.key] = slot.defaultText;
    } else {
      captions[slot.key] = "";
    }
  }
  return { template_id: s.template_id, captions, why: s.why };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { image?: string } | null;
  if (!body?.image) {
    return NextResponse.json({ error: "image required" }, { status: 400 });
  }
  if (!body.image.startsWith("data:image/") && !body.image.startsWith("https://")) {
    return NextResponse.json({ error: "image must be data URL or https URL" }, { status: 400 });
  }

  try {
    const raw = await callOpenRouter({
      model: MODELS.sonnet,
      max_tokens: 1500,
      temperature: 0.9,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "user",
          content: [
            { type: "text", text: USER_PROMPT },
            { type: "image_url", image_url: { url: body.image } },
          ],
        },
      ],
    });

    const parsed = JSON.parse(extractJSON(raw));
    const validated = ResponseSchema.parse(parsed);

    // De-dup template_ids, prefer first occurrence, then top up with unused templates if short.
    const seen = new Set<string>();
    const cleaned: Array<{ template_id: string; captions: Record<string, string>; why: string }> = [];
    for (const s of validated.suggestions) {
      if (seen.has(s.template_id)) continue;
      const c = clampSuggestion(s);
      if (!c) continue;
      seen.add(c.template_id);
      cleaned.push(c);
      if (cleaned.length >= 6) break;
    }

    return NextResponse.json({
      observations: validated.observations,
      suggestions: cleaned,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
