"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MemePreview from "@/components/MemePreview";
import { supabaseBrowser } from "@/lib/supabase";
import { TEMPLATE_BY_ID } from "@/lib/templates";

type Meme = {
  id: string;
  code: string;
  photo_url: string;
  template_id: string;
  captions: Record<string, string>;
  positions?: Record<string, { dy: number }>;
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
        },
      )
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }, []);

  if (memes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--line)] py-16 text-center text-paper/50 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest">
        no memes yet · be the first
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2 flex items-center gap-1.5 bg-gradient-to-t from-black/85 via-black/30 to-transparent">
              {top.length > 0 ? (
                top.map(([emoji, n]) => (
                  <span
                    key={emoji}
                    className="rounded-full bg-ink/85 border border-acid/30 px-2 py-0.5 text-[11px] flex items-center gap-1"
                  >
                    <span>{emoji}</span>
                    <span className="font-[family-name:var(--font-mono)] text-acid">{n}</span>
                  </span>
                ))
              ) : (
                <span className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-widest text-paper/60">
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
