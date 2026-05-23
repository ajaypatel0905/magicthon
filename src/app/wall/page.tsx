import Link from "next/link";
import LiveWall from "@/components/LiveWall";
import { supabaseService } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Meme = {
  id: string;
  code: string;
  photo_url: string;
  template_id: string;
  captions: Record<string, string>;
  positions?: Record<string, { dy: number }>;
  created_at: string;
};

export default async function WallPage() {
  const sb = supabaseService();
  if (!sb) {
    return (
      <main className="px-4 py-10 max-w-2xl mx-auto">
        <p>Storage not configured.</p>
      </main>
    );
  }

  const memesQ = await sb
    .from("memes")
    .select("id, code, photo_url, template_id, captions, positions, created_at")
    .order("created_at", { ascending: false })
    .limit(48);

  const memes = (memesQ.data as Meme[] | null) ?? [];
  const ids = memes.map((m) => m.id);

  const reactQ = ids.length
    ? await sb.from("reactions").select("meme_id, emoji").in("meme_id", ids)
    : { data: [] as Array<{ meme_id: string; emoji: string }> };

  const counts: Record<string, Record<string, number>> = {};
  for (const r of reactQ.data ?? []) {
    counts[r.meme_id] ??= {};
    counts[r.meme_id][r.emoji] = (counts[r.meme_id][r.emoji] ?? 0) + 1;
  }

  // total reactions over last 24h for the header chip
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const todayQ = await sb
    .from("memes")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);

  return (
    <main className="min-h-[100svh] px-4 sm:px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/60 hover:text-acid"
        >
          ← magicthon
        </Link>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-display)] font-extrabold leading-[0.92] tracking-tighter text-[clamp(40px,8vw,86px)]">
              the wall.
            </h1>
            <p className="text-paper/70 mt-3 max-w-xl">
              every meme made on magicthon. new ones land here live. tap any
              card to react.
            </p>
          </div>
          <div className="flex items-center gap-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/60">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-acid animate-pulse" />
              {todayQ.count ?? 0} in last 24h
            </span>
            <span className="text-paper/30">·</span>
            <span>{memes.length} loaded</span>
          </div>
        </div>

        <LiveWall initialMemes={memes} initialCounts={counts} />

        <div className="mt-12 text-center">
          <Link
            href="/#upload"
            className="inline-block bg-acid text-ink font-[family-name:var(--font-mono)] text-[13px] font-bold uppercase tracking-widest px-5 py-3 rounded-sm"
          >
            make your own →
          </Link>
        </div>
      </div>
    </main>
  );
}
