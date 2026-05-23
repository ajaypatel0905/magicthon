"use client";

import { useEffect, useState } from "react";

export default function LiveCounter() {
  const [memes, setMemes] = useState<number | null>(null);
  const [reactions, setReactions] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (!alive) return;
        const j = await res.json();
        setMemes(j.memes ?? 0);
        setReactions(j.reactions ?? 0);
      } catch {
        /* ignore */
      }
    }
    void load();
    const t = setInterval(load, 8000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (memes === null) return null;

  return (
    <span className="hidden md:inline-flex items-center gap-3 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-paper/55">
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-acid animate-pulse" />
        {memes} memes / 24h
      </span>
      <span className="text-paper/30">·</span>
      <span>{reactions} reactions</span>
    </span>
  );
}
