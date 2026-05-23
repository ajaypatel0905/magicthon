import { NextResponse } from "next/server";

export const runtime = "nodejs";

// POST /api/memes/[code]/react — record a reaction.
// Stub: echoes back; real impl writes to Supabase and broadcasts via realtime.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const body = (await req.json().catch(() => null)) as { emoji?: string } | null;
  if (!body?.emoji) {
    return NextResponse.json({ error: "emoji required" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, code, emoji: body.emoji });
}
