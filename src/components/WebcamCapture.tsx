"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
};

/**
 * Webcam capture modal. Uses navigator.mediaDevices.getUserMedia for desktop
 * webcams; falls back to a `capture="environment"` file input if the browser
 * doesn't expose it (or permission denied).
 */
export default function WebcamCapture({ open, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("user");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null);
    setStarting(true);

    (async () => {
      try {
        if (
          typeof navigator === "undefined" ||
          !navigator.mediaDevices?.getUserMedia
        ) {
          throw new Error("Camera API not available in this browser.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "couldn't start camera");
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, facing]);

  function snap() {
    const v = videoRef.current;
    if (!v) return;
    const w = v.videoWidth;
    const h = v.videoHeight;
    if (!w || !h) return;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `snap-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onCapture(file);
      },
      "image/jpeg",
      0.92,
    );
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-[var(--line)] bg-ink-2/95 overflow-hidden shadow-[0_30px_120px_rgba(0,0,0,0.7)]"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)]">
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/70">
            📸 snap a photo
          </span>
          <button
            onClick={onClose}
            aria-label="close camera"
            className="text-xl leading-none text-paper/60 hover:text-acid"
          >
            ×
          </button>
        </div>
        <div className="relative aspect-square bg-black">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-3">
              <p className="text-hot text-sm font-[family-name:var(--font-mono)]">
                {error}
              </p>
              <p className="text-paper/55 text-xs">
                Try allowing camera access in your browser settings, or drop a
                photo instead.
              </p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              {starting && (
                <div className="absolute inset-0 flex items-center justify-center font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/70">
                  starting camera…
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2 p-4">
          <button
            onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
            className="rounded-full border border-[var(--line)] hover:border-acid/60 px-3 py-2 text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-widest"
          >
            ↻ flip
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="rounded-full border border-[var(--line)] hover:border-acid/60 px-4 py-2 text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-widest"
          >
            cancel
          </button>
          <button
            onClick={snap}
            disabled={!!error || starting}
            className="bg-acid text-ink font-[family-name:var(--font-mono)] text-[12px] font-bold uppercase tracking-widest px-5 py-2 rounded-full disabled:opacity-60"
          >
            ⦿ capture
          </button>
        </div>
      </div>
    </div>
  );
}
