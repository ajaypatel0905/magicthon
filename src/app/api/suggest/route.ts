import { NextResponse } from "next/server";
import { z } from "zod";
import { callOpenRouter, MODELS } from "@/lib/openrouter";
import { TEMPLATES, TEMPLATE_BY_ID } from "@/lib/templates";

export const runtime = "nodejs";
export const maxDuration = 60;

const PositionSchema = z.object({
  dx: z.number().optional(),
  dy: z.number().optional(),
  scale: z.number().optional(),
  color: z.string().optional(),
  textCase: z.enum(["upper", "lower", "title", "none"]).optional(),
  rotation: z.number().optional(),
});

const SuggestionSchema = z.object({
  template_id: z.string(),
  captions: z.record(z.string(), z.string()),
  positions: z.record(z.string(), PositionSchema).optional(),
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
- Current topicals — late May 2026, USE THESE when the photo earns it:
  - 🪳 **Cockroach Janta Party (CJP)** — viral political-satire moment of the week. CJI Surya Kant called unemployed youth "cockroaches / parasites of society" on May 15. Gen Z founded the satirical Cockroach Janta Party, 19M Instagram followers in days. Symbol = cockroach (survives anything). Big in Telangana/Hyderabad — direct refs to ₹2L-package engineering grads. Format hooks for tech/worker/student photos: "voted cockroach janta party because [X]", "they called us cockroaches, we made a logo", "we're not unemployed we're between dynasties", "CJI said parasite, we heard mascot". Counter-party (rarely): Oggy Janta Party.
  - IPL 2026 playoffs underway. SRH beat RCB by 55 at home May 22. RCB first to qualify. Final not yet played.
  - Monsoon onset window, board-exam results dropping.
  - Penguin-walking-toward-Charminar/biryani meme is genuinely live.

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

For each suggestion you may ALSO emit optional "positions" — one entry per slot key — to tell the renderer how to lay the caption out so it doesn't cover the photo's subject. Each position is OPTIONAL; only include keys/fields you actually want to tweak. Schema:
  positions: { "<slot_key>": {
    dx?: number,       // horizontal offset in % of meme width (-50..50, 0 = centered)
    dy?: number,       // vertical offset in % of meme height (-80..80, 0 = template default)
    scale?: number,    // font size multiplier (0.6..1.8; default 1)
    color?: "#RRGGBB", // optional override (white default)
    textCase?: "upper" | "lower" | "title" | "none",
    rotation?: number  // degrees, integer (-15..15 usually; bigger only when intentional)
  } }

Position guidelines:
- Look at where the SUBJECT of the photo is. Put the caption in the empty space (top if subject is in lower half, bottom if subject is upper, off to one side if subject is centered).
- For top-bottom-impact: if the subject's face/eyes are in the top third, push the top caption up off-frame is bad — instead reduce its scale or move the bottom caption further down with positive dy.
- For magazine-cover headline: a slight downward dy of 5-10 leaves room for masthead breathing.
- Don't emit positions just for the sake of it. If centered defaults work, OMIT the positions key.
- Rotation: only if the meme genuinely benefits (e.g. a tilted "STAMP" effect for satire). Default to 0.

Output strict JSON matching exactly this schema, no prose:
{
  "observations": [string, ...],     // 3-5 specific things you actually see in the photo (subject, expression, setting, props, vibe)
  "suggestions": [                    // 6 entries, each a different template_id
    {
      "template_id": "<one of the ids above>",
      "captions": { "<slot_key>": "<text>", ... },
      "positions": { ... }?,
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
      captions[slot.key] = v.trim().slice(0, (slot.maxChars ?? 200) + 80);
    } else if (slot.defaultText) {
      captions[slot.key] = slot.defaultText;
    } else {
      captions[slot.key] = "";
    }
  }
  // Clamp position values into safe ranges (the renderer also clamps).
  const positions: Record<string, z.infer<typeof PositionSchema>> = {};
  if (s.positions) {
    for (const slot of tpl.slots) {
      const p = s.positions[slot.key];
      if (!p) continue;
      const clamped: z.infer<typeof PositionSchema> = {};
      if (typeof p.dx === "number") clamped.dx = Math.max(-50, Math.min(50, p.dx));
      if (typeof p.dy === "number") clamped.dy = Math.max(-80, Math.min(80, p.dy));
      if (typeof p.scale === "number") clamped.scale = Math.max(0.5, Math.min(2.5, p.scale));
      if (typeof p.rotation === "number") clamped.rotation = Math.max(-180, Math.min(180, Math.round(p.rotation)));
      if (p.color && /^#[0-9a-fA-F]{6}$/.test(p.color)) clamped.color = p.color;
      if (p.textCase) clamped.textCase = p.textCase;
      if (Object.keys(clamped).length) positions[slot.key] = clamped;
    }
  }
  return { template_id: s.template_id, captions, positions, why: s.why };
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
      max_tokens: 2800,
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

    // De-dup template_ids, drop suggestions that came back with all-empty
    // captions (model truncation guard).
    const seen = new Set<string>();
    const cleaned: Array<{ template_id: string; captions: Record<string, string>; positions?: Record<string, z.infer<typeof PositionSchema>>; why: string }> = [];
    for (const s of validated.suggestions) {
      if (seen.has(s.template_id)) continue;
      const c = clampSuggestion(s);
      if (!c) continue;
      const hasText = Object.values(c.captions).some((v) => v && v.trim().length > 0);
      if (!hasText) continue;
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
