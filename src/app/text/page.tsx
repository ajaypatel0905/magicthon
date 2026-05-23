"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MemePreview from "@/components/MemePreview";
import { TEMPLATE_BY_ID } from "@/lib/templates";

type Suggestion = {
  template_id: string;
  captions: Record<string, string>;
  why: string;
  background: string;
};

const EXAMPLES = [
  "monday standup at 9am",
  "when chatgpt finally agrees with you",
  "trying to explain web3 to your dad",
  "indian wedding food queue",
  "manager said \"can we sync\"",
  "voted cockroach janta party because",
  "first day at the service-based company",
];

export default function TextPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ topic: string; suggestions: Suggestion[] } | null>(null);
  const [shipping, setShipping] = useState<number | null>(null);

  async function generate(t: string) {
    if (!t.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/suggest-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "couldn't write any memes");
      } else {
        setData(json);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "network error");
    } finally {
      setLoading(false);
    }
  }

  async function ship(i: number) {
    if (!data) return;
    setShipping(i);
    try {
      const s = data.suggestions[i];
      const res = await fetch("/api/memes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: s.background,
          template_id: s.template_id,
          captions: s.captions,
          observations: [data.topic],
        }),
      });
      const json = await res.json();
      if (res.ok) router.push(json.url);
      else {
        setError(json.error ?? "couldn't save");
        setShipping(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "network error");
      setShipping(null);
    }
  }

  return (
    <main className="min-h-[100svh] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/60 hover:text-acid"
        >
          ← magicthon
        </Link>
        <div className="font-[family-name:var(--font-mono)] text-[11px] text-acid tracking-widest mt-6 mb-3">
          text mode · no photo needed
        </div>
        <h1 className="font-[family-name:var(--font-display)] font-extrabold leading-[0.92] tracking-tighter text-[clamp(36px,8vw,72px)] mb-4">
          Type the situation.
        </h1>
        <p className="text-paper/70 max-w-xl mb-6">
          Skip the upload. Just describe what&apos;s happening and we&apos;ll
          write six text memes.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void generate(topic);
          }}
          className="space-y-3"
        >
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. monday standup at 9am"
            rows={2}
            className="w-full bg-ink-2 border border-[var(--line)] focus:border-acid rounded-lg px-4 py-3 text-paper text-[17px] font-[family-name:var(--font-body)] focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="bg-acid text-ink font-[family-name:var(--font-mono)] text-[13px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-sm disabled:opacity-60"
            >
              {loading ? "cooking…" : "cook six →"}
            </button>
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/45">
              or try:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.slice(0, 4).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    setTopic(e);
                    void generate(e);
                  }}
                  className="rounded-full border border-[var(--line)] hover:border-acid/60 px-2.5 py-1 text-xs"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-hot/40 bg-[rgba(255,84,54,0.05)] p-4 text-hot text-sm font-[family-name:var(--font-mono)]">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, n) => (
              <div
                key={n}
                className="aspect-square rounded-md bg-ink-2 border border-[var(--line)] animate-pulse"
              />
            ))}
          </div>
        )}

        {data && (
          <div className="mt-10">
            <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/55 mb-4">
              ← topic · {data.topic}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.suggestions.map((s, i) => {
                const tpl = TEMPLATE_BY_ID[s.template_id];
                if (!tpl) return null;
                const busy = shipping === i;
                return (
                  <div
                    key={i}
                    className="rounded-lg p-1.5 ring-1 ring-[var(--line)] hover:ring-acid/60 transition"
                  >
                    <MemePreview
                      template={tpl}
                      photo={s.background}
                      captions={s.captions}
                    />
                    <div className="px-2 py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-acid">
                          {tpl.name}
                        </div>
                        {s.why && (
                          <div className="text-xs text-paper/55 truncate">{s.why}</div>
                        )}
                      </div>
                      <button
                        onClick={() => ship(i)}
                        disabled={busy}
                        className="bg-acid text-ink font-[family-name:var(--font-mono)] text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm disabled:opacity-60 whitespace-nowrap"
                      >
                        {busy ? "…" : "ship →"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
