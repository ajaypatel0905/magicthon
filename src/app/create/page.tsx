"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CreatePage() {
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhoto(sessionStorage.getItem("magicthon:upload"));
  }, []);

  return (
    <main className="min-h-[100svh] px-5 py-10">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/60 hover:text-acid"
        >
          ← back
        </Link>
        <h1 className="font-[family-name:var(--font-display)] font-extrabold text-5xl mt-4 mb-6">
          Cooking your six.
        </h1>

        {photo ? (
          <div className="space-y-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt="your upload"
              className="w-full max-h-[40svh] object-contain rounded-lg border border-[var(--line)]"
            />
            <div className="rounded-lg border border-dashed border-[var(--line)] p-6 text-center text-paper/60 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-widest">
              suggestions UI lands here — wire /api/suggest next
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-[var(--line)] p-8 text-center">
            <p className="text-paper/70 mb-4">No photo yet.</p>
            <Link
              href="/"
              className="inline-block bg-acid text-ink font-[family-name:var(--font-mono)] text-[13px] font-bold uppercase tracking-widest px-4 py-2 rounded-sm"
            >
              ← upload one
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
