"use client";

import { useEffect, useState } from "react";
import MemePreview from "@/components/MemePreview";
import { TEMPLATE_BY_ID } from "@/lib/templates";

const DEMOS = [
  {
    photo:
      "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=600&q=80",
    template_id: "top-bottom-impact",
    captions: {
      top: "WEIGHS 1.2 POUNDS",
      bottom: "COMPLAINTS: UNLIMITED",
    },
    why: "kitten mid-yawn",
  },
  {
    photo:
      "https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=600&q=80",
    template_id: "screenshot-quote",
    captions: {
      name: "LinkedIn at 8 AM",
      message:
        "humbled and excited to announce i will be taking over the rest of your careers, effective immediately",
    },
    why: "corporate energy",
  },
  {
    photo:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80",
    template_id: "banner-side",
    captions: {
      banner: "VOTED COCKROACH JANTA PARTY",
    },
    why: "dev/CJP",
  },
] as const;

export default function HeroDemo() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % DEMOS.length), 3200);
    return () => clearInterval(t);
  }, []);

  const d = DEMOS[i];
  const tpl = TEMPLATE_BY_ID[d.template_id];
  if (!tpl) return null;

  return (
    <div className="relative">
      {/* Polaroid stack effect — older demos peek out */}
      <div className="absolute -inset-3 rounded-lg border border-[var(--line)] opacity-30 rotate-[-3deg]" />
      <div className="absolute -inset-2 rounded-lg border border-[var(--line)] opacity-50 rotate-[1.5deg]" />

      <div className="relative rounded-lg overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5)] transition-transform duration-500">
        <MemePreview
          key={i}
          template={tpl}
          photo={d.photo}
          captions={d.captions as Record<string, string>}
          className="!rounded-none animate-in fade-in zoom-in-95 duration-500"
        />
      </div>

      <div className="mt-3 flex items-center justify-between font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/55">
        <span>magicthon.live / m / {["4a91", "k7r2", "9p3x"][i]}</span>
        <span className="flex gap-1">
          {DEMOS.map((_, n) => (
            <span
              key={n}
              className={`h-1.5 w-4 rounded-full transition ${
                n === i ? "bg-acid" : "bg-paper/15"
              }`}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
