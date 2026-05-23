"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MemePreview from "@/components/MemePreview";
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

export default function CreatePage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [data, setData] = useState<SuggestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhoto(sessionStorage.getItem("magicthon:upload"));
  }, []);

  useEffect(() => {
    if (!photo) return;
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
        <h1 className="font-[family-name:var(--font-display)] font-extrabold text-4xl sm:text-6xl mt-4 mb-2 tracking-tight">
          {loading ? "Reading your photo…" : data ? "Pick one." : "Cooking your six."}
        </h1>
        {data && (
          <p className="text-paper/70 mb-6 text-sm sm:text-base">
            What I see: {data.observations.join(" · ")}
          </p>
        )}

        {!photo && !error && (
          <NoPhoto />
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

        {photo && data && (
          <SuggestionGrid
            photo={photo}
            suggestions={data.suggestions}
            picked={picked}
            onPick={setPicked}
          />
        )}
      </div>
    </main>
  );
}

function NoPhoto() {
  return (
    <div className="rounded-lg border border-[var(--line)] p-8 text-center mt-6">
      <p className="text-paper/70 mb-4">No photo yet.</p>
      <Link
        href="/"
        className="inline-block bg-acid text-ink font-[family-name:var(--font-mono)] text-[13px] font-bold uppercase tracking-widest px-4 py-2 rounded-sm"
      >
        ← upload one
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
          model said no
        </div>
        <p className="text-paper/80 text-sm break-words">{message}</p>
        <button
          onClick={onRetry}
          className="mt-4 inline-block bg-acid text-ink font-[family-name:var(--font-mono)] text-[13px] font-bold uppercase tracking-widest px-4 py-2 rounded-sm"
        >
          try again
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
            className="aspect-square rounded-md bg-ink-2 border border-[var(--line)] relative overflow-hidden"
          >
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[var(--ink-2)] via-[#22221c] to-[var(--ink-2)]" />
            <div className="absolute bottom-2 left-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-paper/40">
              cooking…
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

      {picked !== null && (
        <div className="col-span-full sticky bottom-3 sm:bottom-6 z-30">
          <div className="rounded-lg border border-acid bg-ink/95 backdrop-blur-md p-3 sm:p-4 flex items-center justify-between gap-3 shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
            <div className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/80">
              picked: {TEMPLATE_BY_ID[suggestions[picked].template_id]?.name}
            </div>
            <button
              disabled
              className="bg-acid text-ink font-[family-name:var(--font-mono)] text-[13px] font-bold uppercase tracking-widest px-4 py-2 rounded-sm opacity-60 cursor-not-allowed"
              title="editor lands next"
            >
              edit → (next)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
