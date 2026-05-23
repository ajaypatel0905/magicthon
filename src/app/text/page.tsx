"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MemePreview from "@/components/MemePreview";
import MemeEditor from "@/components/MemeEditor";
import LoadingTicker from "@/components/LoadingTicker";
import { TEMPLATE_BY_ID } from "@/lib/templates";

type Suggestion = {
  template_id: string;
  captions: Record<string, string>;
  why: string;
  background: string;
  image_prompt?: string;
};

const EXAMPLES = [
  "monday standup at 9am",
  "when chatgpt finally agrees with you",
  "trying to explain web3 to your dad",
  "indian wedding food queue",
  "manager said \"can we sync\"",
  "voted cockroach janta party because",
  "first day at the service-based company",
  "Sharma ji ka beta switched companies again",
  "appraisal cycle anxiety",
  "ORR traffic at 8am",
  "what 'ownership' really means in office",
  "fresher's first PR review",
  "Paradise vs Bawarchi argument",
  "WFH but the chai is mid",
  "auntie at the wedding judging your salary",
  "RCB winning the IPL",
  "calling in 'sick' on a Friday",
  "the gym membership in March",
  "exam result day at home",
  "uber driver asking which route",
];

function pickN<T>(arr: T[], n: number, seed = 0): T[] {
  // Pick a stable window starting at seed; rotate through the array.
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[(seed + i) % arr.length]);
  return out;
}

export default function TextPage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ topic: string; suggestions: Suggestion[] } | null>(null);
  const [exampleSeed, setExampleSeed] = useState(0);
  const visibleExamples = pickN(EXAMPLES, 4, exampleSeed);
  const [picked, setPicked] = useState<number | null>(null);

  function pickMeme(i: number) {
    setPicked(i);
    if (typeof window !== "undefined") {
      window.history.pushState({ mt_picked: i }, "");
    }
  }

  useEffect(() => {
    // Restore picked from current history state on mount (e.g., after
    // hitting browser back from /m).
    if (typeof window !== "undefined") {
      const s = window.history.state as { mt_picked?: number } | null;
      if (s && typeof s.mt_picked === "number") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPicked(s.mt_picked);
      }
    }
    function onPop(e: PopStateEvent) {
      const s = e.state as { mt_picked?: number } | null;
      setPicked(s && typeof s.mt_picked === "number" ? s.mt_picked : null);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

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
          write a fresh batch of text memes.
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
              {loading ? "cooking bawa…" : "cook it up →"}
            </button>
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/45">
              or try:
            </span>
            <div className="flex flex-wrap gap-1.5 items-center">
              {visibleExamples.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    setTopic(e);
                    void generate(e);
                  }}
                  className="rounded-full border border-[var(--line)] hover:border-acid/60 px-2.5 py-1 text-xs float-in"
                >
                  {e}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setExampleSeed((s) => (s + 4) % EXAMPLES.length)}
                aria-label="show different examples"
                className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/50 hover:text-acid px-2"
              >
                ↻ more
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-hot/40 bg-[rgba(255,84,54,0.05)] p-4 text-hot text-sm font-[family-name:var(--font-mono)]">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-8">
            <div className="mb-3 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-paper/40">
              cooking captions + images · ~30s
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, n) => (
                <div
                  key={n}
                  className="aspect-square rounded-md bg-ink-2 border border-[var(--line)] relative overflow-hidden flex items-center justify-center p-5 text-center"
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-[var(--ink-2)] via-[#22221c] to-[var(--ink-2)] animate-pulse"
                    style={{ animationDelay: `${n * 150}ms` }}
                  />
                  <div className="relative z-10 max-w-full">
                    <LoadingTicker
                      variant={n % 2 ? "paint" : "cook"}
                      intervalMs={2600 + n * 220}
                      className="!text-[14px] sm:!text-[15px] !text-paper !tracking-wider"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data && picked === null && (
          <div className="mt-10">
            <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/55 mb-4">
              ← topic · {data.topic}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.suggestions.map((s, i) => {
                const tpl = TEMPLATE_BY_ID[s.template_id];
                if (!tpl) return null;
                return (
                  <button
                    key={i}
                    onClick={() => pickMeme(i)}
                    className="text-left rounded-lg p-1.5 ring-1 ring-[var(--line)] hover:ring-acid/60 transition"
                  >
                    <MemePreview
                      template={tpl}
                      photo={s.background}
                      captions={s.captions}
                    />
                    <div className="px-2 py-2">
                      <div className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-acid mb-1">
                        {tpl.name}
                      </div>
                      {s.why && (
                        <div className="text-xs text-paper/55 line-clamp-2">{s.why}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {data && picked !== null && (
          <div className="mt-8">
            <MemeEditor
              photo={data.suggestions[picked].background}
              observations={[data.topic]}
              initial={data.suggestions[picked]}
              allSuggestions={data.suggestions}
              onBack={() => {
                if (typeof window !== "undefined" && window.history.state?.mt_picked !== undefined) {
                  window.history.back();
                } else {
                  setPicked(null);
                }
              }}
              textMode
              topic={data.topic}
            />
          </div>
        )}
      </div>
    </main>
  );
}
