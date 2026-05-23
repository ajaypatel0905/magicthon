"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Full URL to share. */
  url: string;
  /** Short caption / message for share targets that accept it. */
  text?: string;
};

export default function ShareMenu({ url, text = "made a meme on magicthon 🪳" }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "magicthon", text, url });
        setOpen(false);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  function clickShare() {
    void (async () => {
      const ok = await nativeShare();
      if (!ok) setOpen((v) => !v);
    })();
  }

  const enc = encodeURIComponent;
  const targets = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      emoji: "🟢",
      href: `https://wa.me/?text=${enc(text + " " + url)}`,
    },
    {
      key: "x",
      label: "X / Twitter",
      emoji: "𝕏",
      href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`,
    },
    {
      key: "telegram",
      label: "Telegram",
      emoji: "✈︎",
      href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`,
    },
    {
      key: "reddit",
      label: "Reddit",
      emoji: "🟠",
      href: `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(text)}`,
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      emoji: "in",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
    },
    {
      key: "email",
      label: "Email",
      emoji: "✉︎",
      href: `mailto:?subject=${enc("a meme i made on magicthon")}&body=${enc(text + "\n\n" + url)}`,
    },
  ];

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        onClick={clickShare}
        className="rounded-full bg-acid text-ink px-4 py-1.5 text-sm font-[family-name:var(--font-mono)] font-bold uppercase tracking-widest"
      >
        share
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-2 z-50 w-60 rounded-lg border border-[var(--line)] bg-ink/95 backdrop-blur-md shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden">
          <button
            onClick={copyLink}
            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-ink-2 border-b border-[var(--line)]"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">🔗</span>
              <span>{copied ? "copied ✓" : "Copy link"}</span>
            </span>
            <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-paper/40">
              {copied ? "" : "URL"}
            </span>
          </button>
          {targets.map((t) => (
            <a
              key={t.key}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-ink-2 border-b border-[var(--line)] last:border-b-0"
            >
              <span className="text-base w-5 inline-flex justify-center">{t.emoji}</span>
              <span>{t.label}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
