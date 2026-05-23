import Link from "next/link";
import { Suspense } from "react";
import UploadDropzone from "@/components/UploadDropzone";
import HeroMeme from "@/components/HeroMeme";
import LatestWall from "@/components/LatestWall";
import LiveCounter from "@/components/LiveCounter";
import TrySampleButton from "@/components/TrySampleButton";
import MemePreview from "@/components/MemePreview";
import RotatingText from "@/components/RotatingText";
import BawaWidget from "@/components/BawaWidget";
import { TEMPLATE_BY_ID } from "@/lib/templates";

const HERO_TAGLINES = [
  "your photo + a vision model + one shareable link.",
  "drop a photo. the model writes. you pick. ship the link.",
  "memes that actually reference your photo. revolutionary, we know.",
  "Impact font, but with taste. bawa, light lo.",
  "stop using meme generators from 2009.",
  "fresh captions, one survivor. ship it live.",
] as const;

const HERO_EYEBROWS = [
  "the meme tool you actually wanted",
  "build day · ship it live",
  "🪳 voted cockroach janta party",
  "made in hyderabad · runs anywhere",
  "no signup. no watermark. no excuses.",
] as const;

export const dynamic = "force-dynamic";

const MARQUEE = [
  "🪳 funny > clever > earnest",
  "🪳 photo specific or it's not a meme",
  "🪳 impact font, but with taste",
  "🪳 bawa, light lo",
  "🪳 voted cockroach janta party",
  "🪳 no signup, no watermark, no excuses",
  "🪳 fresh captions, one survivor",
  "🪳 we're not unemployed, we're between dynasties",
];

// Section-header memes — render a real meme as the headline for each section.
const SECTION_MEMES = {
  diff: {
    photo: "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=600&q=85",
    template_id: "top-bottom-impact",
    captions: { top: "OTHER MEME TOOLS", bottom: "ARE STUCK IN 2009" },
  },
  cta: {
    // Official White House portrait — public domain. Self-hosted from /public.
    photo: "/trump.jpg",
    template_id: "top-bottom-impact",
    captions: { top: "YOUR TURN", bottom: "DROP A PHOTO, WE'LL COOK" },
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
    <main className="relative overflow-x-clip">
      {/* Page-wide aurora — sits behind everything */}
      <div className="aurora fixed inset-0">
        <div className="aurora-blob" />
      </div>
      <div className="grain fixed inset-0" />

      {/* NAV */}
      <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-[rgba(12,12,10,0.55)] backdrop-blur-xl border-b border-[rgba(244,241,232,0.07)] px-4 py-3">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/" className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight">
            <span className="h-2.5 w-2.5 rounded-full bg-acid shadow-[0_0_16px_var(--acid)]" />
            magicthon
          </Link>
          <LiveCounter />
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href="/text"
            className="hidden sm:inline-flex font-[family-name:var(--font-mono)] text-[11px] font-bold uppercase tracking-widest px-3 py-2 text-paper/70 hover:text-acid rounded-md"
          >
            text mode
          </Link>
          <Link
            href="/wall"
            className="font-[family-name:var(--font-mono)] text-[11px] font-bold uppercase tracking-widest px-3 py-2 text-paper/70 hover:text-acid rounded-md"
          >
            wall
          </Link>
          <Link
            href="#upload"
            className="font-[family-name:var(--font-mono)] text-[12px] font-bold uppercase tracking-widest px-3 py-2 bg-acid text-ink rounded-md hover:-translate-y-0.5 transition shadow-[0_4px_16px_rgba(198,242,78,0.4)]"
          >
            drop photo →
          </Link>
        </div>
      </nav>

      <div className="relative z-10">

      {/* HERO */}
      <header className="relative min-h-[100svh] flex items-center pt-20 pb-10 px-4">
        <div className="relative max-w-6xl mx-auto w-full grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12 items-center">
          {/* Left: wordmark + caption + dropzone */}
          <div className="relative">
            <div className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.28em] uppercase opacity-60 mb-3">
              <RotatingText lines={HERO_EYEBROWS} intervalMs={4200} />
            </div>
            <h1 className="font-[family-name:var(--font-display)] font-extrabold leading-[0.88] tracking-tighter text-[clamp(48px,9vw,108px)]">
              Make it a <span className="text-acid">meme</span>.
            </h1>
            <p className="font-[family-name:var(--font-display)] font-medium leading-[1.1] tracking-tight text-[clamp(16px,2.6vw,22px)] mt-4 mb-5 text-paper/85 min-h-[3em]">
              <RotatingText lines={HERO_TAGLINES} intervalMs={5000} />
            </p>

            {/* Glassy dropzone — sized to match the meme demo on the right. */}
            <div className="glass rounded-2xl p-5 max-w-md mx-auto lg:mx-0">
              <UploadDropzone autoFocus />
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 justify-center sm:justify-start">
                <TrySampleButton />
                <Link
                  href="/text"
                  className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/70 hover:text-acid underline underline-offset-4 decoration-paper/20 hover:decoration-acid"
                >
                  no photo? try text mode →
                </Link>
              </div>
            </div>
          </div>

          {/* Right: the meme itself, cycling */}
          <div className="max-w-md w-full mx-auto lg:mx-0">
            <HeroMeme />
          </div>
        </div>
      </header>

      {/* MARQUEE */}
      <div className="relative bg-acid text-ink overflow-hidden py-3 border-y border-[rgba(0,0,0,0.15)] shadow-[0_4px_24px_rgba(198,242,78,0.18)]">
        <div className="marquee-track flex w-max whitespace-nowrap font-[family-name:var(--font-display)] font-bold uppercase text-[15px] sm:text-[16px] tracking-tight">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE].map((a, i) => (
            <span key={i} className="px-6 sm:px-7 flex items-center gap-6 sm:gap-7">
              {a}
              <span className="text-[12px]">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* DIFF */}
      <section className="px-4 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <SectionMeme kind="diff" className="mb-8" />
          <div className="glass rounded-2xl grid sm:grid-cols-2 overflow-hidden">
            <div className="border-b sm:border-b-0 sm:border-r border-[rgba(244,241,232,0.07)] p-6">
              <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/50 mb-3">
                them
              </div>
              <ul className="space-y-1.5 text-paper/55 text-[15px] leading-relaxed">
                <li>impact font, two text boxes</li>
                <li>templates that ignore your photo</li>
                <li>watermark on the bottom-right</li>
                <li>signup wall for &lsquo;social features&rsquo;</li>
                <li>captions that fit any photo</li>
              </ul>
            </div>
            <div className="p-6">
              <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-acid mb-3">
                us
              </div>
              <ul className="space-y-1.5 text-paper/90 text-[15px] leading-relaxed">
                <li>a vision model that <em className="not-italic text-acid">looks</em></li>
                <li>photo-specific ideas across many templates</li>
                <li>tactile editor — fonts, layouts, your call</li>
                <li>no signup. no watermark. no app.</li>
                <li>realtime reactions on every share link</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* WALL */}
      <section className="px-4 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between gap-4 mb-6">
            <h2 className="font-[family-name:var(--font-display)] font-extrabold leading-[0.92] tracking-tighter text-[clamp(28px,5vw,52px)]">
              The wall.
            </h2>
            <Link
              href="/wall"
              className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/70 hover:text-acid whitespace-nowrap"
            >
              see everything →
            </Link>
          </div>
          <Suspense fallback={<div className="h-48 animate-pulse bg-ink-2 rounded-lg" />}>
            <LatestWall limit={3} />
          </Suspense>
        </div>
      </section>

      {/* THE LOOP */}
      <section className="px-4 py-12 sm:py-14">
        <div className="max-w-5xl mx-auto">
          <div className="font-[family-name:var(--font-mono)] text-[12px] text-acid uppercase tracking-widest mb-3">
            the loop
          </div>
          <h2 className="font-[family-name:var(--font-display)] font-extrabold leading-[0.92] tracking-tighter text-[clamp(32px,6vw,64px)] mb-8">
            Drop → cook → ship → laugh.
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ["📤", "drop", "drag · paste · snap"],
              ["✨", "cook", "photo-aware ideas"],
              ["🎨", "edit", "swap templates. nudge text."],
              ["🔗", "ship", "link. anyone reacts."],
            ].map(([icon, t, sub]) => (
              <div key={t} className="glass rounded-xl p-4 hover:border-acid/40 hover:-translate-y-1 transition">
                <div className="text-3xl mb-2">{icon}</div>
                <div className="font-[family-name:var(--font-display)] font-bold text-lg lowercase mb-0.5">{t}</div>
                <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/55">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="upload" className="px-4 py-14 sm:py-20 scroll-mt-24">
        <div className="max-w-3xl mx-auto">
          <SectionMeme kind="cta" className="mb-8" />
          <div className="glass rounded-2xl p-5 sm:p-6">
            <UploadDropzone />
            <div className="text-center mt-4 flex flex-col items-center gap-2">
              <p className="text-paper/45 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest">
                png · jpg · webp · gif · up to 12 mb
              </p>
              <TrySampleButton />
            </div>
          </div>
        </div>
      </section>

      <footer className="px-4 py-8 border-t border-[rgba(244,241,232,0.07)] text-paper/50 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-center">
        magicthon · 🪳 · hyderabad · made on build day
      </footer>

      </div>

      <BawaWidget />
    </main>
  );
}
