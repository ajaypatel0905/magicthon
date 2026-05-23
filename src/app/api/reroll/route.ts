import { NextResponse } from "next/server";
import { z } from "zod";
import { callOpenRouter, MODELS } from "@/lib/openrouter";
import { TEMPLATE_BY_ID } from "@/lib/templates";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  template_id: z.string(),
  current_captions: z.record(z.string(), z.string()),
  // Provide one of:
  image: z.string().optional(), // data URL or http URL — for photo mode
  topic: z.string().optional(), // text mode
  observations: z.array(z.string()).optional(),
});

const Resp = z.object({
  captions: z.record(z.string(), z.string()),
});

function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first >= 0 && last > first) return raw.slice(first, last + 1);
  return raw.trim();
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { template_id, current_captions, image, topic, observations } = parsed.data;
  const tpl = TEMPLATE_BY_ID[template_id];
  if (!tpl) return NextResponse.json({ error: "unknown template" }, { status: 400 });
  if (!image && !topic) {
    return NextResponse.json({ error: "need image or topic" }, { status: 400 });
  }

  const slotKeys = tpl.slots.map((s) => `"${s.key}"`).join(", ");
  const system = `You are a meme writer. Rewrite the captions for ONE meme — a fresh take, not a copy. Same template, different angle.

Template: ${tpl.id} — ${tpl.name}. ${tpl.vibe}
Slots required: { ${slotKeys} }
Current captions (avoid repeating these jokes): ${JSON.stringify(current_captions)}
${observations ? `Observations about the photo: ${observations.join(" · ")}` : ""}

Rules:
- Funny > clever > earnest. Specific > generic.
- Reference what's actually in the photo / topic.
- No emojis, no hashtags.
- One Hindi/Urdu phrase max per caption — only if natural.

Output strict JSON only:
{ "captions": { ${slotKeys}: "<text>" } }`;

  const userContent: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
    { type: "text", text: topic ? `Topic: ${topic}\n\nWrite a new take.` : "Write a new take on this photo." },
  ];
  if (image) userContent.push({ type: "image_url", image_url: { url: image } });

  try {
    const raw = await callOpenRouter({
      model: MODELS.sonnet,
      max_tokens: 400,
      temperature: 1.0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
    });
    const parsedResp = Resp.parse(JSON.parse(extractJSON(raw)));

    // Clamp + ensure all slot keys exist.
    const captions: Record<string, string> = {};
    for (const slot of tpl.slots) {
      const v = parsedResp.captions[slot.key];
      captions[slot.key] =
        typeof v === "string" && v.trim()
          ? v.trim().slice(0, (slot.maxChars ?? 200) + 80)
          : current_captions[slot.key] ?? slot.defaultText ?? "";
    }
    return NextResponse.json({ captions });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
