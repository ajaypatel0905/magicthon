"use client";

import { useEffect, useState } from "react";
import MemePreview from "@/components/MemePreview";
import { TEMPLATE_BY_ID } from "@/lib/templates";

// Big rotating demo memes — feels like scrolling a feed.
const ROLL = [
  {
    photo: "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=900&q=85",
    template_id: "top-bottom-impact",
    captions: { top: "MY MANAGER: CAN WE SYNC FOR 5 MINS", bottom: "MY SOUL LEAVING THROUGH MY MOUTH" },
    reacts: { "😂": 142, "💀": 38, "🔥": 21 },
  },
  {
    photo: "https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=900&q=85",
    template_id: "screenshot-quote",
    captions: { name: "LinkedIn at 8 AM", message: "humbled and excited to announce i will be taking over the rest of your careers, effective immediately" },
    reacts: { "😂": 211, "💀": 95, "🪳": 47 },
  },
  {
    photo: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&q=85",
    template_id: "banner-side",
    captions: { banner: "VOTED COCKROACH JANTA PARTY" },
    reacts: { "🪳": 309, "😂": 88, "🔥": 12 },
  },
  {
    photo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=85",
    template_id: "magazine-cover",
    captions: { masthead: "TINY THREATS QUARTERLY", headline: "LOCAL FRESHER HEARS 'WE ARE A FAMILY HERE' IN FIRST WEEK", kicker: "reacts accordingly" },
    reacts: { "😂": 174, "💀": 51 },
  },
] as const;

export default function HeroMeme() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % ROLL.length), 3400);
    return () => clearInterval(t);
  }, []);

  const d = ROLL[i];
  const tpl = TEMPLATE_BY_ID[d.template_id];
  if (!tpl) return null;

  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-2xl border border-[var(--line)] rotate-[-2.5deg] opacity-25" />
      <div className="absolute -inset-2 rounded-2xl border border-[var(--line)] rotate-[1.5deg] opacity-50" />

      <div className="relative rounded-xl overflow-hidden shadow-[0_30px_120px_rgba(0,0,0,0.65)] ring-1 ring-acid/20">
        <MemePreview
          key={i}
          template={tpl}
          photo={d.photo}
          captions={d.captions as Record<string, string>}
          className="!rounded-none"
        />
      </div>

      {/* Reaction strip — feels alive */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {Object.entries(d.reacts).map(([e, n]) => (
          <span
            key={e}
            className="rounded-full border border-[var(--line)] bg-ink-2 px-2.5 py-1 text-xs flex items-center gap-1.5"
          >
            <span>{e}</span>
            <span className="font-[family-name:var(--font-mono)] text-acid">{n}</span>
          </span>
        ))}
        <span className="flex-1" />
        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-paper/45">
          live · {String(i + 1).padStart(2, "0")} / {String(ROLL.length).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
