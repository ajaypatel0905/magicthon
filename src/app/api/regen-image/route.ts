import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAndStoreImage } from "@/lib/imagen";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  image_prompt: z.string().min(4).max(400),
  key: z.string().min(1).max(80).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { image_prompt, key } = parsed.data;
  // Fresh suffix forces a new generation each time.
  const suffix = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
  const storageKey = `${(key ?? "regen").slice(0, 40)}-${suffix}`;
  const url = await generateAndStoreImage(image_prompt, storageKey);
  if (!url) {
    return NextResponse.json({ error: "image generation failed" }, { status: 502 });
  }
  return NextResponse.json({ url });
}
