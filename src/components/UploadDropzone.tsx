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

export default function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
          "px-6 py-10 text-center",
          dragging
            ? "border-acid bg-[rgba(198,242,78,0.08)]"
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
          capture="environment"
        />
        <div className="font-[family-name:var(--font-display)] font-bold text-2xl mb-1">
          {busy ? "Reading…" : "Drop a photo"}
        </div>
        <div className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/60">
          drag · paste · tap to choose · or snap one
        </div>
      </label>
      {error && (
        <p className="mt-3 text-[14px] text-hot font-[family-name:var(--font-mono)]">
          {error}
        </p>
      )}
    </div>
  );
}
