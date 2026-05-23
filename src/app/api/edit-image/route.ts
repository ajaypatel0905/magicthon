import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseService, MEMES_BUCKET, publicStorageUrl } from "@/lib/supabase";

const OR_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const IMAGE_MODEL = "google/gemini-2.5-flash-image";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  image: z.string().min(20), // data URL (data:image/...;base64,...) or http URL
  instruction: z.string().min(2).max(500),
});

type ORImageResp = {
  choices?: Array<{
    message?: {
      images?: Array<{ image_url?: { url?: string } }>;
    };
  }>;
  error?: { message?: string };
};

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { image, instruction } = parsed.data;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY missing" }, { status: 500 });
  }

  const prompt = `Edit the attached meme image based on this user direction: "${instruction}". Preserve the same subject and overall composition. Keep it photographic / cinematic. Do not add any new text or words to the image — captions are added by the app on top of the image.`;

  try {
    const res = await fetch(OR_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://magicthon-xt95.vercel.app",
        "X-Title": "Magicthon",
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json(
        { error: `model: ${res.status} ${txt.slice(0, 200)}` },
        { status: 502 },
      );
    }
    const json = (await res.json()) as ORImageResp;
    if (json.error) {
      return NextResponse.json({ error: json.error.message }, { status: 502 });
    }
    const dataUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "no image returned" }, { status: 502 });
    }

    // Decode and upload to Supabase Storage for a stable URL.
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "bad data URL" }, { status: 502 });
    }
    const contentType = match[1];
    const bytes = Uint8Array.from(Buffer.from(match[2], "base64"));
    const sb = supabaseService();
    if (!sb) return NextResponse.json({ error: "storage off" }, { status: 500 });
    const ext = contentType.includes("jpeg")
      ? "jpg"
      : contentType.includes("webp")
        ? "webp"
        : "png";
    const key = `edits/${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}.${ext}`;
    const up = await sb.storage.from(MEMES_BUCKET).upload(key, bytes, {
      contentType,
      upsert: false,
    });
    if (up.error) {
      return NextResponse.json({ error: up.error.message }, { status: 500 });
    }
    return NextResponse.json({ url: publicStorageUrl(key) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 502 },
    );
  }
}
