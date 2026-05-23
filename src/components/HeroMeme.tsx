"use client";

import { useEffect, useRef, useState } from "react";
import MemePreview from "@/components/MemePreview";
import { TEMPLATE_BY_ID } from "@/lib/templates";

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

const AUTO_MS = 4200;

type Flyer = { id: number; emoji: string; left: number; drift: number };

export default function HeroMeme() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [counts, setCounts] = useState<Record<number, Record<string, number>>>(
    Object.fromEntries(ROLL.map((r, idx) => [idx, { ...r.reacts }])),
  );
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const flyerId = useRef(0);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((n) => (n + 1) % ROLL.length), AUTO_MS);
    return () => clearInterval(t);
  }, [paused]);

  function reactTo(emoji: string) {
    setCounts((c) => ({
      ...c,
      [i]: { ...c[i], [emoji]: (c[i][emoji] ?? 0) + 1 },
    }));
    const id = ++flyerId.current;
    // eslint-disable-next-line react-hooks/purity
    const left = 20 + Math.random() * 60;
    // eslint-disable-next-line react-hooks/purity
    const drift = Math.random() > 0.5 ? 30 : -30;
    setFlyers((fs) => [...fs, { id, emoji, left, drift }]);
    setTimeout(() => setFlyers((fs) => fs.filter((f) => f.id !== id)), 1200);
  }

  const d = ROLL[i];
  const tpl = TEMPLATE_BY_ID[d.template_id];
  if (!tpl) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
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

        {/* Flying emojis */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {flyers.map((f) => (
            <span
              key={f.id}
              className="absolute bottom-6 text-3xl"
              style={{
                left: `${f.left}%`,
                animation: "fly-up 1.1s ease-out forwards",
                ["--drift" as string]: `${f.drift}px`,
              }}
            >
              {f.emoji}
            </span>
          ))}
        </div>
      </div>

      {/* Reaction strip — clickable */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {Object.entries(d.reacts).map(([e]) => (
          <button
            key={e}
            onClick={() => reactTo(e)}
            className="rounded-full border border-[var(--line)] bg-ink-2 hover:border-acid/60 active:scale-95 transition px-2.5 py-1 text-xs flex items-center gap-1.5"
          >
            <span>{e}</span>
            <span className="font-[family-name:var(--font-mono)] text-acid">
              {counts[i]?.[e] ?? 0}
            </span>
          </button>
        ))}
        <span className="flex-1" />
        <div className="flex gap-1">
          {ROLL.map((_, n) => (
            <button
              key={n}
              onClick={() => setI(n)}
              aria-label={`go to demo ${n + 1}`}
              className={`h-1.5 w-6 rounded-full transition ${
                n === i ? "bg-acid" : "bg-paper/15 hover:bg-paper/30"
              }`}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fly-up {
          from {
            transform: translateY(0) scale(0.6);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          to {
            transform: translate(var(--drift, 0), -200px) scale(1.4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
