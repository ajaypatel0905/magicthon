import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";

export const runtime = "nodejs";

const ALLOWED = new Set(["😂", "💀", "🔥", "❤️", "🪳"]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const body = (await req.json().catch(() => null)) as { emoji?: string } | null;
  if (!body?.emoji || !ALLOWED.has(body.emoji)) {
    return NextResponse.json({ error: "unknown emoji" }, { status: 400 });
  }

  const sb = supabaseService();
  if (!sb) return NextResponse.json({ error: "supabase not configured" }, { status: 500 });

  const meme = await sb
    .from("memes")
    .select("id")
    .eq("code", code.toLowerCase())
    .single();
  if (meme.error || !meme.data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const ins = await sb
    .from("reactions")
    .insert({ meme_id: meme.data.id, emoji: body.emoji });
  if (ins.error) {
    return NextResponse.json({ error: ins.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
