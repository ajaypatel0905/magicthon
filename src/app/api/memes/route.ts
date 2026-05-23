import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { supabaseService, MEMES_BUCKET, publicStorageUrl } from "@/lib/supabase";

// No confusable chars (no 0/o/l/i/1) for readable share codes.
const makeCode = customAlphabet("abcdefghkmnpqrstuvwxyz23456789", 6);

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  image: z.string().min(10), // data URL or http URL
  template_id: z.string().min(1),
  captions: z.record(z.string(), z.string()),
  positions: z
    .record(
      z.string(),
      z.object({
        dx: z.number().optional(),
        dy: z.number().optional(),
        scale: z.number().optional(),
        color: z.string().optional(),
        textCase: z.enum(["upper", "lower", "title", "none"]).optional(),
        rotation: z.number().optional(),
      }),
    )
    .optional(),
  observations: z.array(z.string()).optional(),
});

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; contentType: string } | null {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  const contentType = m[1];
  const bytes = Uint8Array.from(Buffer.from(m[2], "base64"));
  return { bytes, contentType };
}

function extFor(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

export async function POST(req: Request) {
  const sb = supabaseService();
  if (!sb) {
    return NextResponse.json({ error: "supabase not configured" }, { status: 500 });
  }

  const raw = await req.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { image, template_id, captions, positions, observations } = parsed.data;

  const code = makeCode();
  let photoUrl: string;

  if (image.startsWith("data:")) {
    const decoded = dataUrlToBytes(image);
    if (!decoded) {
      return NextResponse.json({ error: "bad data URL" }, { status: 400 });
    }
    if (decoded.bytes.byteLength > 12 * 1024 * 1024) {
      return NextResponse.json({ error: "image too large" }, { status: 413 });
    }
    const path = `photos/${code}.${extFor(decoded.contentType)}`;
    const up = await sb.storage
      .from(MEMES_BUCKET)
      .upload(path, decoded.bytes, {
        contentType: decoded.contentType,
        upsert: false,
      });
    if (up.error) {
      return NextResponse.json({ error: up.error.message }, { status: 500 });
    }
    photoUrl = publicStorageUrl(path);
  } else if (image.startsWith("http")) {
    photoUrl = image;
  } else if (image.startsWith("linear-gradient") || image.startsWith("radial-gradient")) {
    // text-mode meme: store the CSS gradient string verbatim; MemePreview renders it.
    photoUrl = image;
  } else {
    return NextResponse.json({ error: "image must be data URL, http URL, or CSS gradient" }, { status: 400 });
  }

  const ins = await sb
    .from("memes")
    .insert({
      code,
      photo_url: photoUrl,
      template_id,
      captions,
      positions: positions ?? {},
      observations: observations ?? null,
    })
    .select("code")
    .single();

  if (ins.error) {
    return NextResponse.json({ error: ins.error.message }, { status: 500 });
  }

  return NextResponse.json({ code, url: `/m/${code}` });
}
