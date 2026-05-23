"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MemePreview, { type SlotAdjust } from "@/components/MemePreview";
import LoadingTicker from "@/components/LoadingTicker";
import { TEMPLATES, TEMPLATE_BY_ID, type Template } from "@/lib/templates";

const COLOR_SWATCHES = [
  { key: "white", value: "#ffffff" },
  { key: "acid", value: "#c6f24e" },
  { key: "yellow", value: "#ffd23a" },
  { key: "hot", value: "#ff5436" },
  { key: "black", value: "#000000" },
] as const;

type Suggestion = {
  template_id: string;
  captions: Record<string, string>;
  why: string;
  image_prompt?: string;
};

type Props = {
  photo: string;
  observations: string[];
  initial: Suggestion;
  allSuggestions: Suggestion[];
  onBack: () => void;
  /** Text mode = no real photo, gen'd background. Enables regen-background button. */
  textMode?: boolean;
  /** Optional topic for re-rolling captions in text mode. */
  topic?: string;
};

export default function MemeEditor({
  photo: initialPhoto,
  observations,
  initial,
  allSuggestions,
  onBack,
  textMode = false,
  topic,
}: Props) {
  const router = useRouter();

  const [photo, setPhoto] = useState<string>(initialPhoto);
  const [imagePrompt] = useState<string>(initial.image_prompt ?? "");
  const [templateId, setTemplateId] = useState<string>(initial.template_id);
  const [captions, setCaptions] = useState<Record<string, string>>({
    ...initial.captions,
  });
  const [positions, setPositions] = useState<Record<string, SlotAdjust>>({});
  const [shipping, setShipping] = useState(false);
  const [shipError, setShipError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"png" | "copy" | null>(null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [draggingSlot, setDraggingSlot] = useState<string | null>(null);
  const [rerolling, setRerolling] = useState(false);
  const [regenBg, setRegenBg] = useState(false);
  const [aiInstruction, setAiInstruction] = useState("");
  const [aiEditing, setAiEditing] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slotBox, setSlotBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  const tpl: Template = TEMPLATE_BY_ID[templateId] ?? TEMPLATES[0];

  const renderRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

  function focusSlotInput(key: string) {
    const el = inputRefs.current[key];
    if (!el) return;
    el.focus();
    // Select all text so a quick re-type is easy.
    try {
      el.setSelectionRange(0, el.value.length);
    } catch {
      /* ignore */
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function selectSlot(key: string) {
    setSelectedSlot(key);
    const root = renderRef.current;
    if (!root) return;
    const el = root.querySelector<HTMLElement>(`[data-slot="${key}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const root_r = root.getBoundingClientRect();
    setSlotBox({
      left: r.left - root_r.left,
      top: r.top - root_r.top,
      width: r.width,
      height: r.height,
    });
  }

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

  async function reroll() {
    setRerolling(true);
    try {
      const res = await fetch("/api/reroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: templateId,
          current_captions: captions,
          ...(textMode ? { topic: topic ?? observations.join(", ") } : { image: photo }),
          observations,
        }),
      });
      const json = await res.json();
      if (res.ok && json.captions) {
        setCaptions(json.captions as Record<string, string>);
      }
    } catch {
      /* ignore */
    } finally {
      setRerolling(false);
    }
  }

  // "Edit with AI": snapshot the full current meme preview, send to Gemini
  // via OpenRouter with the user's instruction, swap the photo to the edited
  // result. Slang ticker overlays the preview during the wait.
  async function aiEditImage(instruction: string) {
    const text = instruction.trim();
    if (!text || !renderRef.current) return;
    setAiEditing(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(renderRef.current, {
        cacheBust: true,
        pixelRatio: 1.5,
        skipFonts: false,
      });
      const res = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, instruction: text }),
      });
      const json = await res.json();
      if (res.ok && json.url) {
        setPhoto(json.url);
        // Reset slot positions since the new image is a fresh canvas.
        setPositions({});
        setAiInstruction("");
      } else {
        console.error("edit-image failed", json);
      }
    } catch {
      /* ignore */
    } finally {
      setAiEditing(false);
    }
  }

  async function regenerateBackground() {
    if (!imagePrompt) return;
    setRegenBg(true);
    try {
      const res = await fetch("/api/regen-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_prompt: imagePrompt, key: templateId }),
      });
      const json = await res.json();
      if (res.ok && json.url) {
        setPhoto(json.url);
      }
    } catch {
      /* ignore */
    } finally {
      setRegenBg(false);
    }
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
    // Lazy-load html-to-image only when user actually exports — saves the
    // ~20kB chunk on every other page (and the editor itself on first paint).
    const { toPng } = await import("html-to-image");
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

  // All templates with data-slot wrappers support drag.
  const draggable = true;

  function onPointerDown(e: React.PointerEvent) {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-slot]");
    if (!target) return;
    const key = target.dataset.slot;
    if (!key) return;
    const rect = renderRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const existing = positions[key] ?? {};
    const startDx = existing.dx ?? 0;
    const startDy = existing.dy ?? 0;
    let didDrag = false;

    function move(ev: PointerEvent) {
      const dxPx = ev.clientX - startX;
      const dyPx = ev.clientY - startY;
      // 8px slop — finger wobble doesn't accidentally trigger drag.
      if (!didDrag && Math.hypot(dxPx, dyPx) < 8) return;
      if (!draggable) return; // Only impact templates support drag; tap still focuses input.
      if (!didDrag) {
        didDrag = true;
        setDraggingSlot(key!);
        try { target!.setPointerCapture(ev.pointerId); } catch {}
      }
      const dxPct = (dxPx / rect!.width) * 100;
      const dyPct = (dyPx / rect!.height) * 100;
      // Clamp tight — text stays inside the visible image area.
      const nx = Math.max(-35, Math.min(35, startDx + dxPct));
      const ny = Math.max(-40, Math.min(40, startDy + dyPct));
      setPositions((p) => ({
        ...p,
        [key!]: { ...(p[key!] ?? {}), dx: nx, dy: ny },
      }));
    }
    function up(ev: PointerEvent) {
      try { target!.releasePointerCapture(ev.pointerId); } catch {}
      target!.removeEventListener("pointermove", move);
      target!.removeEventListener("pointerup", up);
      target!.removeEventListener("pointercancel", up);
      // No drag = tap. Select the slot (visual handle) AND focus input.
      if (!didDrag) {
        selectSlot(key!);
        focusSlotInput(key!);
      } else {
        // After drag, refresh selection box to new position.
        selectSlot(key!);
      }
      setDraggingSlot(null);
    }
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
    target.addEventListener("pointercancel", up);
  }

  function updateAdjust(key: string, patch: Partial<SlotAdjust>) {
    setPositions((p) => ({ ...p, [key]: { ...(p[key] ?? {}), ...patch } }));
  }

  function resetAdjust(key: string) {
    setPositions((p) => {
      const next = { ...p };
      delete next[key];
      return next;
    });
  }

  return (
    <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
      {/* Preview */}
      <div>
        <div className="relative max-w-md mx-auto">
          <div
            ref={renderRef}
            onPointerDown={onPointerDown}
            className={`${draggable ? "cursor-grab" : ""} ${draggingSlot ? "cursor-grabbing" : ""}`}
          >
            <MemePreview
              template={tpl}
              photo={photo}
              captions={captions}
              positions={positions}
            />
          </div>

          {/* Canva-style selection box + corner resize handle */}
          {selectedSlot && slotBox && !aiEditing && (
            <SelectionOverlay
              key={selectedSlot}
              slotKey={selectedSlot}
              box={slotBox}
              currentScale={positions[selectedSlot]?.scale ?? 1}
              onResize={(nextScale) => {
                updateAdjust(selectedSlot, { scale: nextScale });
                // Re-measure after the next paint so the box follows.
                requestAnimationFrame(() => selectSlot(selectedSlot));
              }}
              onClose={() => {
                setSelectedSlot(null);
                setSlotBox(null);
              }}
            />
          )}

          {aiEditing && (
            <div className="absolute inset-0 z-20 rounded-md backdrop-blur-md bg-ink/55 flex flex-col items-center justify-center gap-3 text-center p-6">
              <div className="font-[family-name:var(--font-display)] font-extrabold text-xl text-acid">
                editing with AI…
              </div>
              <LoadingTicker
                variant="paint"
                intervalMs={2200}
                className="!text-[13px] !text-paper !tracking-wider"
              />
              <div className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-paper/55 mt-1">
                gemini is repainting · ~6-10s
              </div>
            </div>
          )}
        </div>
        {draggable && (
          <p className="mt-3 text-center font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/45">
            ↕↔ drag the caption to position
          </p>
        )}
        {textMode && imagePrompt && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              onClick={regenerateBackground}
              disabled={regenBg}
              className="rounded-full border border-[var(--line)] hover:border-acid/60 disabled:opacity-60 px-3 py-1.5 text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-widest flex items-center gap-1.5"
            >
              {regenBg ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-acid animate-pulse" />
                  painting…
                </>
              ) : (
                <>↻ regen background</>
              )}
            </button>
          </div>
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
          <div className="flex items-center justify-between gap-2">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/60">
              captions
            </span>
            <button
              onClick={() => reroll()}
              disabled={rerolling || aiEditing}
              className="rounded-full border border-[var(--line)] hover:border-acid/60 disabled:opacity-60 px-3 py-1 text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-widest flex items-center gap-1.5"
              title="ask the model for a different take"
            >
              {rerolling ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-acid animate-pulse" />
                  cooking…
                </>
              ) : (
                <>↻ re-roll</>
              )}
            </button>
          </div>

          {/* Edit with AI — sends whole meme + instruction to Gemini, swaps photo */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (aiInstruction.trim()) void aiEditImage(aiInstruction);
            }}
            className="flex gap-2 items-stretch"
          >
            <input
              value={aiInstruction}
              onChange={(e) => setAiInstruction(e.target.value)}
              placeholder="edit with AI — 'make it cinematic', 'add dramatic lighting'…"
              className="flex-1 bg-ink-2 border border-[var(--line)] rounded-md px-3 py-2 text-base text-paper focus:outline-none focus:border-acid font-[family-name:var(--font-body)]"
              disabled={aiEditing}
            />
            <button
              type="submit"
              disabled={!aiInstruction.trim() || aiEditing}
              className="rounded-md bg-acid text-ink px-3 py-2 text-[11px] font-[family-name:var(--font-mono)] font-bold uppercase tracking-widest disabled:opacity-60 flex items-center gap-1.5"
              title="apply AI direction to the image"
            >
              {aiEditing ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-ink animate-pulse" />
                  painting
                </>
              ) : (
                <>✨ apply</>
              )}
            </button>
          </form>
          {tpl.slots.map((slot) => {
            const v = captions[slot.key] ?? "";
            const long = (slot.maxChars ?? 80) > 60;
            const adj = positions[slot.key] ?? {};
            const hasAdjust =
              (adj.dx ?? 0) !== 0 ||
              (adj.dy ?? 0) !== 0 ||
              (adj.scale ?? 1) !== 1 ||
              adj.color !== undefined;
            return (
              <div key={slot.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/60">
                    {slot.label}
                  </span>
                  {hasAdjust && (
                    <button
                      onClick={() => resetAdjust(slot.key)}
                      className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-paper/45 hover:text-acid"
                    >
                      reset
                    </button>
                  )}
                </div>
                {long ? (
                  <textarea
                    ref={(el) => {
                      inputRefs.current[slot.key] = el;
                    }}
                    value={v}
                    onChange={(e) =>
                      setCaptions((c) => ({ ...c, [slot.key]: e.target.value }))
                    }
                    rows={2}
                    maxLength={(slot.maxChars ?? 200) + 30}
                    className="w-full bg-ink-2 border border-[var(--line)] rounded px-3 py-2 text-base text-paper focus:outline-none focus:border-acid font-[family-name:var(--font-body)]"
                  />
                ) : (
                  <input
                    ref={(el) => {
                      inputRefs.current[slot.key] = el;
                    }}
                    value={v}
                    onChange={(e) =>
                      setCaptions((c) => ({ ...c, [slot.key]: e.target.value }))
                    }
                    maxLength={(slot.maxChars ?? 200) + 30}
                    className="w-full bg-ink-2 border border-[var(--line)] rounded px-3 py-2 text-base text-paper focus:outline-none focus:border-acid font-[family-name:var(--font-body)]"
                  />
                )}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {/* Size controls */}
                  <div className="flex items-center rounded-full border border-[var(--line)] overflow-hidden">
                    <button
                      onClick={() =>
                        updateAdjust(slot.key, {
                          scale: Math.max(0.5, +(((adj.scale ?? 1) - 0.1).toFixed(2))),
                        })
                      }
                      title="smaller"
                      className="px-3 py-1.5 text-xs hover:bg-ink-2 min-w-9"
                    >
                      A−
                    </button>
                    <span className="font-[family-name:var(--font-mono)] text-[10px] px-1.5 text-paper/45 select-none border-x border-[var(--line)]">
                      {((adj.scale ?? 1) * 100).toFixed(0)}%
                    </span>
                    <button
                      onClick={() =>
                        updateAdjust(slot.key, {
                          scale: Math.min(2, +(((adj.scale ?? 1) + 0.1).toFixed(2))),
                        })
                      }
                      title="bigger"
                      className="px-3 py-1.5 text-xs hover:bg-ink-2 min-w-9"
                    >
                      A+
                    </button>
                  </div>

                  {/* Color swatches + custom picker */}
                  <div className="flex items-center gap-1.5 px-1">
                    {COLOR_SWATCHES.map((s) => {
                      const isActive =
                        (adj.color ?? "#ffffff").toLowerCase() === s.value.toLowerCase();
                      return (
                        <button
                          key={s.key}
                          onClick={() => updateAdjust(slot.key, { color: s.value })}
                          title={`color: ${s.key}`}
                          className={`w-6 h-6 rounded-full border-2 transition ${
                            isActive ? "border-acid scale-110" : "border-[var(--line)]"
                          }`}
                          style={{ background: s.value }}
                        />
                      );
                    })}
                    {/* Custom color picker — hidden native input behind a swatch */}
                    <label
                      title="pick any color"
                      className="relative w-6 h-6 rounded-full border-2 border-[var(--line)] cursor-pointer overflow-hidden flex items-center justify-center"
                      style={{
                        background:
                          "conic-gradient(from 0deg, #ff5436, #ffd23a, #c6f24e, #4ec1f2, #6e3aff, #ff5436)",
                      }}
                    >
                      <input
                        type="color"
                        value={adj.color ?? "#ffffff"}
                        onChange={(e) =>
                          updateAdjust(slot.key, { color: e.target.value })
                        }
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        aria-label="custom color"
                      />
                      <span className="relative text-[10px] font-bold text-ink mix-blend-difference">
                        +
                      </span>
                    </label>
                  </div>

                  {/* Case toggle */}
                  <div className="flex items-center rounded-full border border-[var(--line)] overflow-hidden">
                    {(["upper", "title", "lower"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => updateAdjust(slot.key, { textCase: c })}
                        title={`case: ${c}`}
                        className={`px-2.5 py-1.5 text-[11px] font-bold hover:bg-ink-2 ${
                          (adj.textCase ?? "none") === c
                            ? "bg-acid text-ink"
                            : ""
                        }`}
                      >
                        {c === "upper" ? "AA" : c === "lower" ? "aa" : "Aa"}
                      </button>
                    ))}
                  </div>

                  {/* X-axis nudge */}
                  <div className="flex items-center rounded-full border border-[var(--line)] overflow-hidden">
                    <button
                      onClick={() =>
                        updateAdjust(slot.key, {
                          dx: Math.max(-45, (adj.dx ?? 0) - 5),
                        })
                      }
                      title="nudge left"
                      className="px-3 py-1.5 text-xs hover:bg-ink-2 min-w-9"
                    >
                      ←
                    </button>
                    <button
                      onClick={() =>
                        updateAdjust(slot.key, {
                          dx: Math.min(45, (adj.dx ?? 0) + 5),
                        })
                      }
                      title="nudge right"
                      className="px-3 py-1.5 text-xs hover:bg-ink-2 min-w-9 border-l border-[var(--line)]"
                    >
                      →
                    </button>
                  </div>

                  {/* Clear text */}
                  <button
                    onClick={() => setCaptions((c) => ({ ...c, [slot.key]: "" }))}
                    title="delete caption"
                    className="ml-auto rounded-full border border-[var(--line)] hover:border-hot/60 hover:text-hot px-3 py-1.5 text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-widest"
                  >
                    × clear
                  </button>
                </div>
              </div>
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

        {/* Action row — sticky at bottom on mobile so ship-it stays in reach */}
        <div className="sticky bottom-3 lg:static z-40">
          <div className="flex items-center gap-3 p-3 lg:p-0 lg:pt-2 rounded-lg lg:rounded-none border border-acid/30 lg:border-0 lg:border-t lg:border-[var(--line)] bg-ink/95 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none shadow-[0_8px_40px_rgba(0,0,0,0.6)] lg:shadow-none">
            <button
              onClick={onBack}
              className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/60 hover:text-acid"
            >
              ← back
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
        </div>
        {shipError && (
          <p className="text-hot text-sm font-[family-name:var(--font-mono)]">{shipError}</p>
        )}
      </div>
    </div>
  );
}

/** Canva-style dashed selection box with corner resize handle. */
function SelectionOverlay({
  slotKey,
  box,
  currentScale,
  onResize,
  onClose,
}: {
  slotKey: string;
  box: { left: number; top: number; width: number; height: number };
  currentScale: number;
  onResize: (next: number) => void;
  onClose: () => void;
}) {
  function onHandleDown(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLDivElement;
    const startX = e.clientX;
    const startY = e.clientY;
    const startScale = currentScale || 1;
    const baseDiag = Math.hypot(box.width, box.height);
    try { target.setPointerCapture(e.pointerId); } catch {}
    function move(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const delta = (dx + dy) / 2;
      const factor = 1 + delta / (baseDiag * 0.5);
      const next = Math.max(0.5, Math.min(2.5, startScale * factor));
      onResize(+next.toFixed(2));
    }
    function up(ev: PointerEvent) {
      try { target.releasePointerCapture(ev.pointerId); } catch {}
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      target.removeEventListener("pointercancel", up);
    }
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
    target.addEventListener("pointercancel", up);
  }
  return (
    <>
      {/* dashed selection box */}
      <div
        className="absolute pointer-events-none border-2 border-dashed border-acid rounded-sm z-30"
        style={{
          left: box.left - 6,
          top: box.top - 6,
          width: box.width + 12,
          height: box.height + 12,
        }}
        aria-hidden
      />
      {/* slot label */}
      <div
        className="absolute z-30 pointer-events-auto font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest bg-acid text-ink px-2 py-0.5 rounded-sm flex items-center gap-2"
        style={{ left: box.left - 6, top: Math.max(0, box.top - 22) }}
      >
        <span>{slotKey}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="deselect"
          className="text-base leading-none"
        >
          ×
        </button>
      </div>
      {/* corner resize handle — big tap target on phone */}
      <div
        onPointerDown={onHandleDown}
        className="absolute z-30 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize select-none"
        style={{
          left: box.left + box.width + 6,
          top: box.top + box.height + 6,
          width: 36,
          height: 36,
          touchAction: "none",
        }}
        title="drag to resize"
      >
        <span className="block w-5 h-5 bg-acid border-2 border-ink rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.4)]" />
      </div>
    </>
  );
}
