import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().max(80).optional(),
  message: z.string().min(2).max(2000),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const sb = supabaseService();
  if (!sb) return NextResponse.json({ error: "storage not configured" }, { status: 500 });

  const ins = await sb
    .from("feedback")
    .insert({
      name: parsed.data.name?.trim() || null,
      message: parsed.data.message.trim(),
    });
  if (ins.error) {
    return NextResponse.json({ error: ins.error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
