"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MemePreview, { type SlotAdjust } from "@/components/MemePreview";
import { supabaseBrowser } from "@/lib/supabase";
import { TEMPLATE_BY_ID } from "@/lib/templates";

type Meme = {
  id: string;
  code: string;
  photo_url: string;
  template_id: string;
  captions: Record<string, string>;
  positions?: Record<string, SlotAdjust>;
  created_at: string;
};

type Props = {
  initialMemes: Meme[];
  initialCounts: Record<string, Record<string, number>>;
};

export default function LiveWall({ initialMemes, initialCounts }: Props) {
  const [memes, setMemes] = useState<Meme[]>(initialMemes);
  const [counts, setCounts] = useState<Record<string, Record<string, number>>>(initialCounts);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  // Tracks "memeId:emoji" tokens that just incremented — used to pulse the chip.
  const [pulseKeys, setPulseKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;

    const channel = sb
      .channel("wall")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "memes" },
        (payload) => {
          const m = payload.new as Meme;
          setMemes((cur) => {
            if (cur.some((x) => x.id === m.id)) return cur;
            return [m, ...cur].slice(0, 60);
          });
          setFreshIds((s) => new Set(s).add(m.id));
          setTimeout(() => {
            setFreshIds((s) => {
              const n = new Set(s);
              n.delete(m.id);
              return n;
            });
          }, 2500);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reactions" },
        (payload) => {
          const r = payload.new as { meme_id: string; emoji: string };
          setCounts((c) => ({
            ...c,
            [r.meme_id]: {
              ...(c[r.meme_id] ?? {}),
              [r.emoji]: ((c[r.meme_id]?.[r.emoji] ?? 0) + 1),
            },
          }));
          const key = `${r.meme_id}:${r.emoji}`;
          setPulseKeys((s) => new Set(s).add(key));
          setTimeout(() => {
            setPulseKeys((s) => {
              const n = new Set(s);
              n.delete(key);
              return n;
            });
          }, 900);
        },
      )
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }, []);

  // Belt-and-braces poll every 30s: re-aggregate reaction counts for the
  // visible memes. Catches anything realtime dropped (closed tabs, network blips).
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    async function refresh() {
      const ids = memes.map((m) => m.id);
      if (ids.length === 0) return;
      const { data, error } = await sb!
        .from("reactions")
        .select("meme_id, emoji")
        .in("meme_id", ids);
      if (!alive || error || !data) return;
      const next: Record<string, Record<string, number>> = {};
      for (const r of data as Array<{ meme_id: string; emoji: string }>) {
        next[r.meme_id] ??= {};
        next[r.meme_id][r.emoji] = (next[r.meme_id][r.emoji] ?? 0) + 1;
      }
      setCounts(next);
    }
    const t = setInterval(refresh, 30_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [memes]);

  if (memes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--line)] py-16 text-center text-paper/50 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest">
        no memes yet · be the first
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {memes.map((m) => {
        const tpl = TEMPLATE_BY_ID[m.template_id];
        if (!tpl) return null;
        const rc = counts[m.id] ?? {};
        const top = Object.entries(rc)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3);
        const fresh = freshIds.has(m.id);
        return (
          <Link
            key={m.id}
            href={`/m/${m.code}`}
            className={`group relative block rounded-lg overflow-hidden transition ring-1 ${
              fresh
                ? "ring-acid shadow-[0_0_24px_rgba(198,242,78,0.45)] float-in"
                : "ring-[var(--line)] hover:ring-acid/60 hover:-translate-y-1"
            }`}
          >
            <MemePreview
              template={tpl}
              photo={m.photo_url}
              captions={m.captions}
              positions={m.positions}
            />
            {fresh && (
              <div className="absolute top-2 right-2 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-widest bg-acid text-ink px-1.5 py-0.5 rounded-sm shimmer">
                ✦ new
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2 flex items-center gap-1.5 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
              {top.length > 0 ? (
                top.map(([emoji, n]) => {
                  const isPulse = pulseKeys.has(`${m.id}:${emoji}`);
                  return (
                    <span
                      key={emoji}
                      className={`rounded-full bg-ink/85 border px-2 py-0.5 text-[12px] flex items-center gap-1 transition ${
                        isPulse
                          ? "border-acid scale-110 shadow-[0_0_12px_rgba(198,242,78,0.6)]"
                          : "border-acid/30"
                      }`}
                    >
                      <span>{emoji}</span>
                      <span className="font-[family-name:var(--font-mono)] text-acid">{n}</span>
                    </span>
                  );
                })
              ) : (
                <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-paper/55">
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
