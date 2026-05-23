import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = supabaseService();
  if (!sb) return NextResponse.json({ memes: 0, reactions: 0 });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [m, r] = await Promise.all([
    sb.from("memes").select("id", { count: "exact", head: true }).gte("created_at", since),
    sb.from("reactions").select("id", { count: "exact", head: true }).gte("created_at", since),
  ]);

  return NextResponse.json({
    memes: m.count ?? 0,
    reactions: r.count ?? 0,
  });
}
