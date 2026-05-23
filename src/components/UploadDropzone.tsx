"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadDropzone({
  autoFocus = false,
}: {
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pulse, setPulse] = useState(autoFocus);

  // On desktop landing: briefly pulse the dropzone so the user's eye lands here.
  useEffect(() => {
    if (!autoFocus) return;
    const t = setTimeout(() => setPulse(false), 2400);
    return () => clearTimeout(t);
  }, [autoFocus]);

  const handle = useCallback(
    async (file: File) => {
      setError(null);
      if (!ACCEPTED.includes(file.type)) {
        setError("PNG, JPG, WEBP, or GIF, please.");
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        setError("Keep it under 12 MB.");
        return;
      }
      setBusy(true);
      try {
        const dataUrl = await fileToDataURL(file);
        sessionStorage.setItem("magicthon:upload", dataUrl);
        sessionStorage.setItem("magicthon:upload:name", file.name);
        // Different photo = different suggestions. Drop the old cache.
        sessionStorage.removeItem("magicthon:suggest:cache");
        router.push("/create");
      } catch {
        setError("Couldn't read that file. Try another.");
        setBusy(false);
      }
    },
    [router],
  );

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/"),
      );
      if (!item) return;
      const file = item.getAsFile();
      if (file) void handle(file);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handle]);

  return (
    <div className="w-full">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handle(file);
        }}
        className={[
          "block cursor-pointer rounded-lg border-2 border-dashed transition",
          "px-6 py-8 sm:py-10 text-center",
          dragging
            ? "border-acid bg-[rgba(198,242,78,0.08)]"
            : pulse
              ? "border-acid bg-[rgba(198,242,78,0.06)] shadow-[0_0_0_4px_rgba(198,242,78,0.18)]"
              : "border-[var(--line)] bg-ink-2 hover:border-acid/60",
          busy ? "opacity-60 pointer-events-none" : "",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handle(f);
          }}
        />
        <div className="font-[family-name:var(--font-display)] font-bold text-2xl mb-1">
          {busy ? "Reading…" : "Drop a photo"}
        </div>
        <div className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/60">
          drag · paste · tap to choose
        </div>
      </label>
      <div className="mt-2 text-center">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Create a camera-only file input on demand so the main picker
            // stays at "Photos / Files".
            const cam = document.createElement("input");
            cam.type = "file";
            cam.accept = "image/*";
            cam.setAttribute("capture", "environment");
            cam.onchange = () => {
              const f = cam.files?.[0];
              if (f) void handle(f);
            };
            cam.click();
          }}
          className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/55 hover:text-acid underline underline-offset-4 decoration-paper/20"
        >
          or 📸 snap with camera
        </button>
      </div>
      {error && (
        <p className="mt-3 text-[14px] text-hot font-[family-name:var(--font-mono)]">
          {error}
        </p>
      )}
    </div>
  );
}
