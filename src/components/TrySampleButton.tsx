"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SAMPLES = [
  "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=900&q=85",
  "https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=900&q=85",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&q=85",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=85",
];

export default function TrySampleButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    const src = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
    try {
      const blob = await (await fetch(src)).blob();
      const reader = new FileReader();
      reader.onload = () => {
        sessionStorage.setItem("magicthon:upload", reader.result as string);
        sessionStorage.setItem("magicthon:upload:name", "sample.jpg");
        sessionStorage.removeItem("magicthon:suggest:cache");
        router.push("/create");
      };
      reader.readAsDataURL(blob);
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={go}
      disabled={busy}
      className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/70 hover:text-acid underline underline-offset-4 decoration-paper/30 hover:decoration-acid"
    >
      {busy ? "loading sample…" : "or try with a sample photo →"}
    </button>
  );
}
