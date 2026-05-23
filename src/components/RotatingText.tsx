"use client";

import { useEffect, useState } from "react";

type Props = {
  lines: readonly string[];
  intervalMs?: number;
  className?: string;
  /** Don't auto-rotate (e.g. when off-screen). */
  paused?: boolean;
};

/**
 * Cycles through `lines` on a timer. Lazy-randomizes the start index so two
 * adjacent RotatingTexts don't sync on the same phrase.
 */
export default function RotatingText({
  lines,
  intervalMs = 3600,
  className = "",
  paused = false,
}: Props) {
  const [i, setI] = useState(() => Math.floor(Math.random() * lines.length));

  useEffect(() => {
    if (paused) return;
    const t = setInterval(
      () => setI((n) => (n + 1) % lines.length),
      intervalMs,
    );
    return () => clearInterval(t);
  }, [intervalMs, lines.length, paused]);

  return (
    <span key={i} className={`float-in inline-block ${className}`}>
      {lines[i]}
    </span>
  );
}
