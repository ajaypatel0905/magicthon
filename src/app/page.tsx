import Link from "next/link";
import { Suspense } from "react";
import UploadDropzone from "@/components/UploadDropzone";
import HeroMeme from "@/components/HeroMeme";
import LatestWall from "@/components/LatestWall";
import MemePreview from "@/components/MemePreview";
import { TEMPLATE_BY_ID } from "@/lib/templates";

export const dynamic = "force-dynamic";

const MARQUEE = [
  "🪳 funny > clever > earnest",
  "🪳 photo specific or it's not a meme",
  "🪳 impact font, but with taste",
  "🪳 bawa, light lo",
  "🪳 voted cockroach janta party",
  "🪳 no signup, no watermark, no excuses",
  "🪳 six suggestions, one survivor",
  "🪳 we're not unemployed, we're between dynasties",
];

// Section-header memes — render a real meme as the headline for each section.
const SECTION_MEMES = {
  diff: {
    photo: "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=600&q=85",
    template_id: "top-bottom-impact",
    captions: { top: "OTHER MEME TOOLS", bottom: "ARE STUCK IN 2009" },
  },
  wall: {
    photo: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=85",
    template_id: "bottom-only",
    captions: { bottom: "people are making memes RIGHT NOW. live." },
  },
  cta: {
    photo: "https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=600&q=85",
    template_id: "motivational",
    captions: { title: "YOUR TURN", subtitle: "drop a photo. we'll cook." },
  },
} as const;

function SectionMeme({ kind, className = "" }: { kind: keyof typeof SECTION_MEMES; className?: string }) {
  const m = SECTION_MEMES[kind];
  const tpl = TEMPLATE_BY_ID[m.template_id];
  if (!tpl) return null;
  return (
    <div className={`max-w-xs sm:max-w-sm mx-auto ${className}`}>
      <MemePreview template={tpl} photo={m.photo} captions={m.captions as Record<string, string>} />
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative">
      {/* NAV */}
      <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-[rgba(12,12,10,0.7)] px-4 py-3 backdrop-blur-md border-b border-[var(--line)]">
        <Link href="/" className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight">
          <span className="h-2.5 w-2.5 rounded-full bg-acid shadow-[0_0_16px_var(--acid)]" />
          magicthon
          <span className="ml-2 hidden sm:inline-block font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-paper/45">
            🪳 hyderabad / may 2026
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          <Link
            href="/wall"
            className="font-[family-name:var(--font-mono)] text-[11px] font-bold uppercase tracking-widest px-3 py-2 text-paper/70 hover:text-acid rounded-sm"
          >
            wall
          </Link>
          <Link
            href="#upload"
            className="font-[family-name:var(--font-mono)] text-[12px] font-bold uppercase tracking-widest px-3 py-2 bg-acid text-ink rounded-sm hover:-translate-y-0.5 transition"
          >
            drop photo →
          </Link>
        </div>
      </nav>

      {/* HERO — meme dominates */}
      <header className="relative min-h-[100svh] flex items-center pt-24 pb-12 px-4 overflow-hidden border-b border-[var(--line)]">
        <div className="grain" />
        <div className="absolute top-1/3 -left-32 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(255,84,54,0.16),transparent_62%)] blur-2xl pointer-events-none" />
        <div className="absolute -top-44 -right-24 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(198,242,78,0.18),transparent_62%)] blur-2xl pointer-events-none" />

        <div className="relative z-[2] max-w-6xl mx-auto w-full grid lg:grid-cols-[0.95fr_1.05fr] gap-8 lg:gap-14 items-center">
          {/* Left: wordmark + caption + dropzone */}
          <div>
            <div className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.28em] uppercase opacity-60 mb-4">
              the meme tool you actually wanted
            </div>
            <h1 className="font-[family-name:var(--font-display)] font-extrabold leading-[0.84] tracking-tighter text-[clamp(64px,16vw,180px)]">
              make it
              <br />a <span className="text-acid">meme</span>.
            </h1>
            <p className="font-[family-name:var(--font-display)] font-medium leading-[0.96] tracking-tight text-[clamp(20px,4.5vw,32px)] mt-6 mb-6 text-paper/85">
              your photo + a vision model + six ideas + one shareable link.
              <br />
              <span className="text-paper/55">that&apos;s the whole product. →</span>
            </p>
            <div className="hidden sm:block">
              <UploadDropzone />
            </div>
            <Link
              href="#upload"
              className="sm:hidden block w-full text-center bg-acid text-ink font-[family-name:var(--font-mono)] text-[13px] font-bold uppercase tracking-widest px-5 py-4 rounded-sm"
            >
              drop a photo →
            </Link>
          </div>

          {/* Right: the meme itself, cycling */}
          <div className="max-w-md w-full mx-auto lg:mx-0">
            <HeroMeme />
          </div>
        </div>
      </header>

      {/* MARQUEE — full of 🪳 because the cockroach is the moment */}
      <div className="bg-acid text-ink overflow-hidden py-3 border-b border-[var(--line)]">
        <div className="marquee-track flex w-max whitespace-nowrap font-[family-name:var(--font-display)] font-bold uppercase text-[16px] tracking-tight">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE].map((a, i) => (
            <span key={i} className="px-7 flex items-center gap-7">
              {a}
              <span className="text-[12px]">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* DIFF — section header is itself a meme */}
      <section className="px-4 py-16 sm:py-24 border-b border-[var(--line)]">
        <div className="max-w-5xl mx-auto">
          <SectionMeme kind="diff" className="mb-12" />
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="rounded-lg border border-[var(--line)] p-5 bg-ink-2/40">
              <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/50 mb-3">
                them
              </div>
              <ul className="space-y-2 text-paper/65 text-[15px] leading-relaxed">
                <li>impact font, two text boxes</li>
                <li>templates that ignore your photo</li>
                <li>watermark on the bottom-right</li>
                <li>signup wall for ‟social features”</li>
                <li>captions that fit literally any photo</li>
              </ul>
            </div>
            <div className="rounded-lg border border-acid/40 p-5 bg-[rgba(198,242,78,0.04)]">
              <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-acid mb-3">
                us
              </div>
              <ul className="space-y-2 text-paper/90 text-[15px] leading-relaxed">
                <li>a vision model that <em className="not-italic text-acid">looks</em></li>
                <li>six photo-specific ideas across six templates</li>
                <li>tactile editor — fonts, layouts, your call</li>
                <li>no signup. no watermark. no app.</li>
                <li>realtime reactions on every share link</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* WALL — biggest section, the product as content */}
      <section className="px-4 py-16 sm:py-24 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto">
          <SectionMeme kind="wall" className="mb-10" />
          <div className="flex items-end justify-between gap-4 mb-6">
            <h2 className="font-[family-name:var(--font-display)] font-extrabold leading-[0.92] tracking-tighter text-[clamp(28px,5vw,52px)]">
              the wall.
            </h2>
            <Link
              href="/wall"
              className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/70 hover:text-acid whitespace-nowrap"
            >
              see everything →
            </Link>
          </div>
          <Suspense fallback={<div className="h-48 animate-pulse bg-ink-2 rounded-lg" />}>
            <LatestWall limit={9} />
          </Suspense>
        </div>
      </section>

      {/* THE FLOW — visual recipe, less text */}
      <section className="px-4 py-16 sm:py-20 border-b border-[var(--line)]">
        <div className="max-w-5xl mx-auto">
          <div className="font-[family-name:var(--font-mono)] text-[12px] text-acid tracking-widest mb-3">
            the loop
          </div>
          <h2 className="font-[family-name:var(--font-display)] font-extrabold leading-[0.92] tracking-tighter text-[clamp(32px,6vw,64px)] mb-10">
            drop → cook → ship → laugh.
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ["📤", "drop", "drag · paste · snap"],
              ["✨", "cook", "six ideas. photo-aware."],
              ["🎨", "edit", "swap templates. nudge text."],
              ["🔗", "ship", "link. anyone reacts."],
            ].map(([icon, t, sub]) => (
              <div key={t} className="rounded-lg border border-[var(--line)] bg-ink-2/40 p-4 hover:border-acid/40 transition">
                <div className="text-3xl mb-2">{icon}</div>
                <div className="font-[family-name:var(--font-display)] font-bold text-lg lowercase mb-0.5">{t}</div>
                <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/55">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section — meme + dropzone */}
      <section id="upload" className="px-4 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto">
          <SectionMeme kind="cta" className="mb-10" />
          <UploadDropzone />
          <p className="text-center text-paper/45 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest mt-4">
            png · jpg · webp · gif · up to 12 mb
          </p>
        </div>
      </section>

      <footer className="px-4 py-8 border-t border-[var(--line)] text-paper/50 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-center">
        magicthon · 🪳 · hyderabad · made on build day
      </footer>
    </main>
  );
}
