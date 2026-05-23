"use client";

import { useEffect, useRef, useState } from "react";
import MemePreview, { type SlotAdjust } from "@/components/MemePreview";
import ShareMenu from "@/components/ShareMenu";
import { supabaseBrowser } from "@/lib/supabase";
import type { Template } from "@/lib/templates";

const EMOJIS = ["😂", "💀", "🔥", "❤️", "🪳"] as const;

type Props = {
  memeId: string;
  template: Template;
  photoUrl: string;
  captions: Record<string, string>;
  positions?: Record<string, SlotAdjust>;
  initialCounts: Record<string, number>;
  code: string;
};

export default function MemeViewer({
  memeId,
  template,
  photoUrl,
  captions,
  positions,
  initialCounts,
  code,
}: Props) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [busy, setBusy] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const lastReactRef = useRef<{ emoji: string; t: number } | null>(null);
  const memeRef = useRef<HTMLDivElement>(null);

  async function download() {
    if (!memeRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(memeRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        skipFonts: false,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `magicthon-${code}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      /* ignore */
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    const channel = sb
      .channel(`meme-${memeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reactions",
          filter: `meme_id=eq.${memeId}`,
        },
        (payload) => {
          const row = payload.new as { emoji?: string };
          if (!row?.emoji) return;
          // Avoid double-counting the optimistic update we just made.
          const last = lastReactRef.current;
          if (last && last.emoji === row.emoji && Date.now() - last.t < 1500) {
            lastReactRef.current = null;
            return;
          }
          setCounts((c) => ({ ...c, [row.emoji!]: (c[row.emoji!] ?? 0) + 1 }));
        },
      )
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [memeId]);

  async function react(emoji: string) {
    setBusy(emoji);
    // Optimistic increment.
    setCounts((c) => ({ ...c, [emoji]: (c[emoji] ?? 0) + 1 }));
    // eslint-disable-next-line react-hooks/purity
    lastReactRef.current = { emoji, t: Date.now() };
    try {
      const res = await fetch(`/api/memes/${code}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) throw new Error("react failed");
    } catch {
      // Roll back on failure.
      setCounts((c) => {
        const next = { ...c };
        const v = (next[emoji] ?? 1) - 1;
        if (v <= 0) delete next[emoji];
        else next[emoji] = v;
        return next;
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-3">
      <div ref={memeRef}>
        <MemePreview
          template={template}
          photo={photoUrl}
          captions={captions}
          positions={positions}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => react(e)}
            disabled={busy === e}
            className={`rounded-full border border-[var(--line)] bg-ink-2 hover:border-acid/60 active:scale-95 transition px-3 py-1.5 text-sm flex items-center gap-1.5 ${busy === e ? "opacity-60" : ""}`}
          >
            <span className="text-base">{e}</span>
            <span className="font-[family-name:var(--font-mono)] text-[12px] text-acid">
              {counts[e] ?? 0}
            </span>
          </button>
        ))}

        <div className="flex-1" />

        <button
          onClick={download}
          disabled={downloading}
          className="rounded-full border border-[var(--line)] bg-ink-2 hover:border-acid/60 active:scale-95 transition px-4 py-1.5 text-sm font-[family-name:var(--font-mono)] uppercase tracking-widest disabled:opacity-60"
          title="download as PNG"
        >
          {downloading ? "rendering…" : "↓ png"}
        </button>

        <ShareMenu
          url={typeof window !== "undefined" ? `${window.location.origin}/m/${code}` : `/m/${code}`}
        />
      </div>
    </div>
  );
}
