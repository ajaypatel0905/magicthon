"use client";

import { useEffect, useState } from "react";
import { SLANG_LINES, SHIP_LINES } from "@/lib/slang";

type Variant = "cook" | "paint" | "ship";

function pick(variant: Variant): readonly string[] {
  if (variant === "ship") return SHIP_LINES;
  return SLANG_LINES;
}

export default function LoadingTicker({
  variant = "cook",
  intervalMs = 3000,
  className = "",
}: {
  variant?: Variant;
  intervalMs?: number;
  className?: string;
}) {
  const lines = pick(variant);
  // Lazy random start so two tickers don't sync on the same phrase.
  const [i, setI] = useState(() => Math.floor(Math.random() * lines.length));

  useEffect(() => {
    const t = setInterval(() => {
      setI((n) => (n + 1) % lines.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs, lines.length]);

  return (
    <span
      className={`inline-flex items-start gap-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/70 ${className}`}
    >
      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-acid animate-pulse flex-none" />
      <span key={i} className="float-in text-balance break-words">
        {lines[i]}
      </span>
    </span>
  );
}
