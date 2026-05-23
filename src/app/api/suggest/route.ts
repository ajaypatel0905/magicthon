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

  return `You are a meme writer who writes memes that actually land. People will look at the photo someone uploaded and read your captions side by side — your job is to make them laugh out loud.

Hard rules — break any and the meme dies:
1. The caption must reference something specifically visible in THIS photo. No generic captions that would work on any photo. If you can swap the photo and the caption still works, the caption is wrong.
2. Funny > clever > earnest. We are not writing inspirational quotes. We are writing memes.
3. Specificity > abstraction. "the third tab in the bottom row of my brain" beats "my thoughts".
4. No "When you..." or "POV:" unless it genuinely makes it funnier. They are crutches.
5. No emojis in captions. No hashtags. No exclamation marks unless the joke truly needs one.
6. Each suggestion must use a DIFFERENT template_id. Six suggestions = six different templates.

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
