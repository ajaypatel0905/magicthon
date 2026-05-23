"use client";

import { Fragment, useEffect, useRef, useState } from "react";

/** Very small inline markdown renderer: **bold**, *italic*, `code`. Newlines preserved by CSS. */
function MarkdownInline({ text }: { text: string }) {
  const tokens: Array<{ type: "text" | "bold" | "italic" | "code"; value: string }> = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) tokens.push({ type: "text", value: text.slice(last, m.index) });
    const t = m[0];
    if (t.startsWith("**")) tokens.push({ type: "bold", value: t.slice(2, -2) });
    else if (t.startsWith("`")) tokens.push({ type: "code", value: t.slice(1, -1) });
    else tokens.push({ type: "italic", value: t.slice(1, -1) });
    last = m.index + t.length;
  }
  if (last < text.length) tokens.push({ type: "text", value: text.slice(last) });
  return (
    <>
      {tokens.map((tk, i) => {
        if (tk.type === "bold")
          return (
            <strong key={i} className="font-bold text-acid">
              {tk.value}
            </strong>
          );
        if (tk.type === "italic")
          return (
            <em key={i} className="italic">
              {tk.value}
            </em>
          );
        if (tk.type === "code")
          return (
            <code key={i} className="font-[family-name:var(--font-mono)] text-[0.9em] bg-ink-2 px-1 rounded">
              {tk.value}
            </code>
          );
        return <Fragment key={i}>{tk.value}</Fragment>;
      })}
    </>
  );
}

type ChatMsg = { role: "user" | "assistant"; content: string };

const GREETING: ChatMsg = {
  role: "assistant",
  content:
    "Just because everyone is fascinated about chatbots — here I am. I'm Bawa, the meme-tool helper. Ask anything: how it works, editor tips, where to drop a photo. Or tap Feedback to roast us.",
};

export default function BawaWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "feedback">("chat");

  // chat state
  const [history, setHistory] = useState<ChatMsg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // feedback state
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, open, tab]);

  async function send() {
    const t = input.trim();
    if (!t || sending) return;
    setInput("");
    const next: ChatMsg[] = [...history, { role: "user", content: t }];
    setHistory(next);
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: next }),
      });
      const json = await res.json();
      if (res.ok && json.reply) {
        setHistory((h) => [...h, { role: "assistant", content: json.reply }]);
      } else {
        setHistory((h) => [
          ...h,
          {
            role: "assistant",
            content: "nakko, network laga hua hai — try once more in a sec.",
          },
        ]);
      }
    } catch {
      setHistory((h) => [
        ...h,
        { role: "assistant", content: "haalat aisi hai ki kuch error aaya. retry?" },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function submitFeedback() {
    setError(null);
    if (!message.trim()) {
      setError("type something first 🪳");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, message }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "save failed");
      }
      setSubmitted(true);
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Floating button + label */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-center gap-1.5">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="open Bawa helper"
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-acid text-ink font-bold shadow-[0_8px_30px_rgba(198,242,78,0.35)] flex items-center justify-center hover:scale-105 active:scale-95 transition text-2xl"
        >
          {open ? "×" : "🪳"}
        </button>
        {!open && (
          <span className="font-[family-name:var(--font-mono)] text-[9px] sm:text-[10px] uppercase tracking-widest text-paper/70 bg-ink/85 backdrop-blur px-2 py-0.5 rounded-full border border-[var(--line)] whitespace-nowrap pointer-events-none">
            need cockroach help?
          </span>
        )}
      </div>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm h-[min(70vh,560px)] rounded-xl border border-[var(--line)] bg-ink/95 backdrop-blur-md shadow-[0_20px_80px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden">
          <div className="flex border-b border-[var(--line)]">
            <button
              onClick={() => setTab("chat")}
              className={`flex-1 py-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest ${
                tab === "chat" ? "bg-acid text-ink" : "text-paper/70 hover:text-acid"
              }`}
            >
              chat with bawa
            </button>
            <button
              onClick={() => setTab("feedback")}
              className={`flex-1 py-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest border-l border-[var(--line)] ${
                tab === "feedback" ? "bg-acid text-ink" : "text-paper/70 hover:text-acid"
              }`}
            >
              feedback
            </button>
          </div>

          {tab === "chat" && (
            <>
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 space-y-3"
              >
                {history.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[90%] rounded-lg px-3 py-2 text-[14px] leading-relaxed whitespace-pre-line ${
                      m.role === "user"
                        ? "ml-auto bg-acid text-ink"
                        : "bg-ink-2 border border-[var(--line)] text-paper"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <MarkdownInline text={m.content} />
                    ) : (
                      m.content
                    )}
                  </div>
                ))}
                {sending && (
                  <div className="bg-ink-2 border border-[var(--line)] rounded-lg px-3 py-2 inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-acid animate-pulse" />
                    <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/60">
                      bawa is typing
                    </span>
                  </div>
                )}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
                className="flex gap-2 p-3 border-t border-[var(--line)]"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="ask bawa…"
                  className="flex-1 bg-ink-2 border border-[var(--line)] rounded-md px-3 py-2 text-base text-paper focus:outline-none focus:border-acid"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="bg-acid text-ink font-[family-name:var(--font-mono)] text-[12px] font-bold uppercase tracking-widest px-4 py-2 rounded-md disabled:opacity-60"
                >
                  send
                </button>
              </form>
            </>
          )}

          {tab === "feedback" && (
            <div className="flex-1 overflow-y-auto p-4">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🪳</div>
                  <p className="font-[family-name:var(--font-display)] text-xl mb-2">
                    Hau, got it.
                  </p>
                  <p className="text-paper/60 text-sm">
                    we&apos;ll read every word. bawa promises.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setName("");
                      setMessage("");
                    }}
                    className="mt-4 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/55 hover:text-acid"
                  >
                    send another →
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submitFeedback();
                  }}
                  className="space-y-3"
                >
                  <p className="text-paper/70 text-sm">
                    what would make magicthon better? bug, idea, a meme that fell flat — anything.
                  </p>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="your name (optional)"
                    className="w-full bg-ink-2 border border-[var(--line)] rounded-md px-3 py-2 text-base text-paper focus:outline-none focus:border-acid"
                  />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="bolo bhai…"
                    rows={5}
                    className="w-full bg-ink-2 border border-[var(--line)] rounded-md px-3 py-2 text-base text-paper focus:outline-none focus:border-acid"
                  />
                  {error && (
                    <p className="text-hot text-xs font-[family-name:var(--font-mono)]">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting || !message.trim()}
                    className="w-full bg-acid text-ink font-[family-name:var(--font-mono)] text-[12px] font-bold uppercase tracking-widest py-2.5 rounded-md disabled:opacity-60"
                  >
                    {submitting ? "saving…" : "send it →"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
