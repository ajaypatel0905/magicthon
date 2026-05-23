"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import MemePreview from "@/components/MemePreview";
import { TEMPLATES, TEMPLATE_BY_ID, type Template } from "@/lib/templates";

type Suggestion = {
  template_id: string;
  captions: Record<string, string>;
  why: string;
};

type Props = {
  photo: string;
  observations: string[];
  initial: Suggestion;
  allSuggestions: Suggestion[];
  onBack: () => void;
};

export default function MemeEditor({
  photo,
  observations,
  initial,
  allSuggestions,
  onBack,
}: Props) {
  const router = useRouter();

  const [templateId, setTemplateId] = useState<string>(initial.template_id);
  const [captions, setCaptions] = useState<Record<string, string>>({
    ...initial.captions,
  });
  const [positions, setPositions] = useState<Record<string, { dy: number }>>({});
  const [shipping, setShipping] = useState(false);
  const [shipError, setShipError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"png" | "copy" | null>(null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [draggingSlot, setDraggingSlot] = useState<string | null>(null);

  const tpl: Template = TEMPLATE_BY_ID[templateId] ?? TEMPLATES[0];

  const renderRef = useRef<HTMLDivElement>(null);

  const suggestionByTpl = useMemo(() => {
    const map: Record<string, Suggestion> = {};
    for (const s of allSuggestions) map[s.template_id] = s;
    return map;
  }, [allSuggestions]);

  // Reset positions when template changes (positions are per-template).
  function switchTemplate(nextId: string) {
    setPositions({});
    setTemplateId(nextId);
    // Carry compatible slot values where keys match, otherwise pull from a suggestion if we have one for this template.
    const nextTpl = TEMPLATE_BY_ID[nextId];
    if (!nextTpl) return;
    const sugg = suggestionByTpl[nextId];
    const next: Record<string, string> = {};
    for (const slot of nextTpl.slots) {
      if (captions[slot.key] !== undefined && captions[slot.key] !== "") {
        next[slot.key] = captions[slot.key];
      } else if (sugg?.captions[slot.key]) {
        next[slot.key] = sugg.captions[slot.key];
      } else if (slot.defaultText) {
        next[slot.key] = slot.defaultText;
      } else {
        next[slot.key] = "";
      }
    }
    setCaptions(next);
  }

  async function ship() {
    setShipping(true);
    setShipError(null);
    try {
      const res = await fetch("/api/memes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: photo,
          template_id: templateId,
          captions,
          positions,
          observations,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setShipError(json.error ?? "couldn't save");
        setShipping(false);
        return;
      }
      router.push(json.url);
    } catch (e) {
      setShipError(e instanceof Error ? e.message : "network error");
      setShipping(false);
    }
  }

  async function exportPng(): Promise<Blob | null> {
    if (!renderRef.current) return null;
    const dataUrl = await toPng(renderRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      skipFonts: false,
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  }

  async function onDownload() {
    setExporting("png");
    setExportMsg(null);
    try {
      const blob = await exportPng();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `magicthon-${templateId}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportMsg("downloaded");
    } catch (e) {
      setExportMsg(e instanceof Error ? e.message : "export failed");
    } finally {
      setExporting(null);
      setTimeout(() => setExportMsg(null), 2000);
    }
  }

  async function onCopy() {
    setExporting("copy");
    setExportMsg(null);
    try {
      const blob = await exportPng();
      if (!blob) return;
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
        setExportMsg("copied to clipboard");
      } else {
        setExportMsg("clipboard not supported, try download");
      }
    } catch (e) {
      setExportMsg(e instanceof Error ? e.message : "copy failed");
    } finally {
      setExporting(null);
      setTimeout(() => setExportMsg(null), 2000);
    }
  }

  const draggable = templateId === "top-bottom-impact" || templateId === "bottom-only";

  function onPointerDown(e: React.PointerEvent) {
    if (!draggable) return;
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-slot]");
    if (!target) return;
    const key = target.dataset.slot;
    if (!key) return;
    const rect = renderRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startY = e.clientY;
    const startDy = positions[key]?.dy ?? 0;
    setDraggingSlot(key);
    target.setPointerCapture(e.pointerId);

    function move(ev: PointerEvent) {
      const dyPct = ((ev.clientY - startY) / rect!.height) * 100;
      const next = Math.max(-50, Math.min(50, startDy + dyPct));
      setPositions((p) => ({ ...p, [key!]: { dy: next } }));
    }
    function up(ev: PointerEvent) {
      try { target!.releasePointerCapture(ev.pointerId); } catch {}
      target!.removeEventListener("pointermove", move);
      target!.removeEventListener("pointerup", up);
      target!.removeEventListener("pointercancel", up);
      setDraggingSlot(null);
    }
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
    target.addEventListener("pointercancel", up);
  }

  return (
    <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
      {/* Preview */}
      <div>
        <div
          ref={renderRef}
          onPointerDown={onPointerDown}
          className={`max-w-md mx-auto ${draggable ? "cursor-grab" : ""} ${draggingSlot ? "cursor-grabbing" : ""}`}
        >
          <MemePreview
            template={tpl}
            photo={photo}
            captions={captions}
            positions={positions}
          />
        </div>
        {draggable && (
          <p className="mt-3 text-center font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/45">
            ↕ drag the caption to position
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-6">
        {/* Template chips */}
        <div>
          <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/60 mb-2">
            template
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATES.map((t) => {
              const isCurrent = t.id === templateId;
              return (
                <button
                  key={t.id}
                  onClick={() => switchTemplate(t.id)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-[family-name:var(--font-mono)] uppercase tracking-widest border transition ${
                    isCurrent
                      ? "bg-acid text-ink border-acid"
                      : "border-[var(--line)] text-paper/70 hover:border-acid/60"
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Caption inputs */}
        <div className="space-y-3">
          {tpl.slots.map((slot) => {
            const v = captions[slot.key] ?? "";
            const long = (slot.maxChars ?? 80) > 60;
            return (
              <label key={slot.key} className="block">
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/60 mb-1 block">
                  {slot.label}
                </span>
                {long ? (
                  <textarea
                    value={v}
                    onChange={(e) =>
                      setCaptions((c) => ({ ...c, [slot.key]: e.target.value }))
                    }
                    rows={2}
                    maxLength={(slot.maxChars ?? 200) + 30}
                    className="w-full bg-ink-2 border border-[var(--line)] rounded px-3 py-2 text-paper focus:outline-none focus:border-acid font-[family-name:var(--font-body)]"
                  />
                ) : (
                  <input
                    value={v}
                    onChange={(e) =>
                      setCaptions((c) => ({ ...c, [slot.key]: e.target.value }))
                    }
                    maxLength={(slot.maxChars ?? 200) + 30}
                    className="w-full bg-ink-2 border border-[var(--line)] rounded px-3 py-2 text-paper focus:outline-none focus:border-acid font-[family-name:var(--font-body)]"
                  />
                )}
              </label>
            );
          })}
        </div>

        {/* Export row */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onDownload}
            disabled={exporting !== null}
            className="rounded-full border border-[var(--line)] hover:border-acid/60 disabled:opacity-60 px-4 py-2 text-sm font-[family-name:var(--font-mono)] uppercase tracking-widest"
          >
            {exporting === "png" ? "rendering…" : "↓ png"}
          </button>
          <button
            onClick={onCopy}
            disabled={exporting !== null}
            className="rounded-full border border-[var(--line)] hover:border-acid/60 disabled:opacity-60 px-4 py-2 text-sm font-[family-name:var(--font-mono)] uppercase tracking-widest"
          >
            {exporting === "copy" ? "rendering…" : "⎘ copy"}
          </button>
          {exportMsg && (
            <span className="text-[12px] font-[family-name:var(--font-mono)] text-acid">
              {exportMsg}
            </span>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-3 pt-2 border-t border-[var(--line)]">
          <button
            onClick={onBack}
            className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/60 hover:text-acid"
          >
            ← back to picks
          </button>
          <div className="flex-1" />
          <button
            onClick={ship}
            disabled={shipping}
            className="bg-acid text-ink font-[family-name:var(--font-mono)] text-[13px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-sm disabled:opacity-60"
          >
            {shipping ? "shipping…" : "ship it →"}
          </button>
        </div>
        {shipError && (
          <p className="text-hot text-sm font-[family-name:var(--font-mono)]">{shipError}</p>
        )}
      </div>
    </div>
  );
}
