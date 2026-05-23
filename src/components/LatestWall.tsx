import Link from "next/link";
import MemePreview from "@/components/MemePreview";
import { supabaseService } from "@/lib/supabase";
import { TEMPLATE_BY_ID } from "@/lib/templates";

type MemeRow = {
  id: string;
  code: string;
  photo_url: string;
  template_id: string;
  captions: Record<string, string>;
};

type ReactionRow = { meme_id: string; emoji: string };

export default async function LatestWall({ limit = 6 }: { limit?: number }) {
  const sb = supabaseService();
  if (!sb) return null;

  const q = await sb
    .from("memes")
    .select("id, code, photo_url, template_id, captions")
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (q.data as MemeRow[] | null) ?? [];
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--line)] py-12 text-center text-paper/50 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest">
        no memes yet · be the first one
      </div>
    );
  }

  const ids = rows.map((r) => r.id);
  const reactQ = await sb
    .from("reactions")
    .select("meme_id, emoji")
    .in("meme_id", ids);
  const counts: Record<string, Record<string, number>> = {};
  for (const r of (reactQ.data as ReactionRow[] | null) ?? []) {
    counts[r.meme_id] ??= {};
    counts[r.meme_id][r.emoji] = (counts[r.meme_id][r.emoji] ?? 0) + 1;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {rows.map((r) => {
        const tpl = TEMPLATE_BY_ID[r.template_id];
        if (!tpl) return null;
        const rc = counts[r.id] ?? {};
        const top = Object.entries(rc)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3);
        return (
          <Link
            key={r.code}
            href={`/m/${r.code}`}
            className="group relative block rounded-lg overflow-hidden ring-1 ring-[var(--line)] hover:ring-acid/60 hover:-translate-y-1 transition"
          >
            <MemePreview
              template={tpl}
              photo={r.photo_url}
              captions={r.captions}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2 flex items-center gap-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition">
              {top.length > 0 ? (
                top.map(([emoji, n]) => (
                  <span
                    key={emoji}
                    className="rounded-full bg-ink/80 border border-acid/30 px-2 py-0.5 text-[11px] flex items-center gap-1"
                  >
                    <span>{emoji}</span>
                    <span className="font-[family-name:var(--font-mono)] text-acid">{n}</span>
                  </span>
                ))
              ) : (
                <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-paper/60">
                  no reactions yet
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
