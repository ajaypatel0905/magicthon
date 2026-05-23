import { NextResponse } from "next/server";

export const runtime = "nodejs";

// POST /api/suggest
// body: { image: dataUrl }
// returns: { suggestions: MemeSuggestion[] }
// Stub: returns 6 placeholder ideas. Real impl wires a vision model next.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { image?: string } | null;
  if (!body?.image) {
    return NextResponse.json({ error: "image required" }, { status: 400 });
  }

  const suggestions = Array.from({ length: 6 }).map((_, i) => ({
    id: `stub-${i}`,
    template: ["drake", "two-buttons", "expanding-brain", "distracted-bf", "this-is-fine", "boardroom"][i],
    topText: `STUB IDEA ${i + 1}`,
    bottomText: "wire the real model",
    reason: "placeholder until vision LLM is wired",
  }));

  return NextResponse.json({ suggestions });
}
