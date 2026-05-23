import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export const runtime = "nodejs";

// POST /api/memes — create a shareable meme record.
// Stub returns a fresh code; real impl persists to Supabase.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad json" }, { status: 400 });

  const code = nanoid(6);
  return NextResponse.json({ code, url: `/m/${code}` });
}
