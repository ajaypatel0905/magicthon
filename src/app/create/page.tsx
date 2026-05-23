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
};

type SuggestResponse = {
  observations: string[];
  suggestions: Suggestion[];
};

const CACHE_KEY = "magicthon:suggest:cache";

type CacheEntry = { photo: string; data: SuggestResponse };

function readCache(): CacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

export default function CreatePage() {
  // `hydrated` blocks the NoPhoto flash on remount. We only know if there's a
  // photo after the first client paint reads sessionStorage.
  const [hydrated, setHydrated] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [data, setData] = useState<SuggestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    const p = sessionStorage.getItem("magicthon:upload");
    const cached = readCache();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhoto(p);
    if (p && cached && cached.photo === p) {
      setData(cached.data);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!photo) return;
    // Skip the LLM call if we already have suggestions cached for this exact photo.
    const cached = readCache();
    if (cached?.photo === photo && cached.data) {
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: photo }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error ?? "couldn't write any memes — try again");
        } else {
          setData(json as SuggestResponse);
          try {
            sessionStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ photo, data: json }),
            );
          } catch {
            /* quota or serialization — fine to ignore */
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [photo]);

  return (
    <main className="min-h-[100svh] px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/60 hover:text-acid"
        >
          ← back
        </Link>
        <h1 className="font-[family-name:var(--font-display)] font-extrabold text-4xl sm:text-6xl mt-4 mb-4 tracking-tight">
          {loading ? "Cooking your six." : data ? "Pick one." : "Drop a photo."}
        </h1>
        {data && (
          <p className="text-paper/70 mb-6 text-sm sm:text-base">
            <span className="text-paper/40">model saw:</span>{" "}
            {data.observations.join(" · ")}
          </p>
        )}

        {hydrated && !photo && !error && (
          <NoPhoto />
        )}

        {!hydrated && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, n) => (
              <div
                key={n}
                className="aspect-square rounded-md bg-ink-2 border border-[var(--line)] relative overflow-hidden flex items-center justify-center p-3 text-center"
              >
                <div
                  className="absolute inset-0 animate-pulse bg-gradient-to-br from-[var(--ink-2)] via-[#22221c] to-[var(--ink-2)]"
                  style={{ animationDelay: `${n * 130}ms` }}
                />
                <div className="relative z-10">
                  <LoadingTicker
                    intervalMs={2600 + n * 220}
                    className="!text-[10px] !text-paper/70"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {photo && error && (
          <ErrorCard message={error} photo={photo} onRetry={() => {
            setError(null);
            setData(null);
            // trigger refetch by toggling state
            setPhoto(null);
            setTimeout(() => setPhoto(sessionStorage.getItem("magicthon:upload")), 0);
          }} />
        )}

        {photo && !data && !error && (
          <LoadingGrid photo={photo} />
        )}

        {photo && data && picked === null && (
          <SuggestionGrid
            photo={photo}
            suggestions={data.suggestions}
            picked={picked}
            onPick={setPicked}
          />
        )}

        {photo && data && picked !== null && (
          <div className="mt-4">
            <MemeEditor
              photo={photo}
              observations={data.observations}
              initial={data.suggestions[picked]}
              allSuggestions={data.suggestions}
              onBack={() => setPicked(null)}
            />
          </div>
        )}
      </div>
    </main>
  );
}

function NoPhoto() {
  return (
    <div className="rounded-lg border border-[var(--line)] p-8 text-center mt-6">
      <p className="text-paper/70 mb-4">kya re miya — no photo yet.</p>
      <Link
        href="/"
        className="inline-block bg-acid text-ink font-[family-name:var(--font-mono)] text-[13px] font-bold uppercase tracking-widest px-4 py-2 rounded-sm"
      >
        ← drop one
      </Link>
    </div>
  );
}

function ErrorCard({
  message,
  photo,
  onRetry,
}: {
  message: string;
  photo: string;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        alt="your upload"
        className="w-full max-h-[35svh] object-contain rounded-lg border border-[var(--line)]"
      />
      <div className="rounded-lg border border-hot/40 bg-[rgba(255,84,54,0.05)] p-5">
        <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-hot mb-2">
          model said nakko
        </div>
        <p className="text-paper/80 text-sm break-words">{message}</p>
        <button
          onClick={onRetry}
          className="mt-4 inline-block bg-acid text-ink font-[family-name:var(--font-mono)] text-[13px] font-bold uppercase tracking-widest px-4 py-2 rounded-sm"
        >
          ek aur try →
        </button>
      </div>
    </div>
  );
}

function LoadingGrid({ photo }: { photo: string }) {
  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        alt="your upload"
        className="w-full max-h-[30svh] object-contain rounded-lg border border-[var(--line)] mb-6"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-md bg-ink-2 border border-[var(--line)] relative overflow-hidden flex items-center justify-center p-3 text-center"
          >
            <div
              className="absolute inset-0 animate-pulse bg-gradient-to-br from-[var(--ink-2)] via-[#22221c] to-[var(--ink-2)]"
              style={{ animationDelay: `${i * 130}ms` }}
            />
            <div className="relative z-10">
              <LoadingTicker
                intervalMs={2400 + i * 270}
                className="!text-[10px] !text-paper/80 !tracking-wider"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuggestionGrid({
  photo,
  suggestions,
  picked,
  onPick,
}: {
  photo: string;
  suggestions: Suggestion[];
  picked: number | null;
  onPick: (i: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {suggestions.map((s, i) => {
        const tpl = TEMPLATE_BY_ID[s.template_id];
        if (!tpl) return null;
        const isPicked = picked === i;
        return (
          <button
            key={i}
            onClick={() => onPick(i)}
            className={`text-left group transition rounded-lg p-1.5 ${
              isPicked
                ? "ring-2 ring-acid bg-[rgba(198,242,78,0.05)]"
                : "ring-1 ring-[var(--line)] hover:ring-acid/60"
            }`}
          >
            <MemePreview template={tpl} photo={photo} captions={s.captions} />
            <div className="px-2 py-2">
              <div className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-acid mb-1">
                {tpl.name}
              </div>
              <div className="font-[family-name:var(--font-body)] text-xs text-paper/60 leading-snug line-clamp-2">
                {s.why}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
