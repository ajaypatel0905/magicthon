import Link from "next/link";
import { Suspense } from "react";
import UploadDropzone from "@/components/UploadDropzone";
import HeroDemo from "@/components/HeroDemo";
import LatestWall from "@/components/LatestWall";

export const dynamic = "force-dynamic";

const APHORISMS = [
  "Ship happens",
  "Funny > clever > earnest",
  "Impact font, but with taste",
  "404: taste not found",
  "Localhost is not a submission",
  "Your photo is the joke",
  "Bawa, light lo",
  "Memes ≠ inspirational quotes",
  "Six suggestions, one survivor",
  "We're not unemployed, we're between dynasties",
];

export default function Home() {
  return (
    <main className="relative">
      {/* NAV */}
      <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-[rgba(12,12,10,0.6)] px-5 py-3 backdrop-blur-md border-b border-[var(--line)]">
        <Link href="/" className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight">
          <span className="h-2.5 w-2.5 rounded-full bg-acid shadow-[0_0_16px_var(--acid)]" />
          magicthon
        </Link>
        <div className="flex items-center gap-1.5">
          <Link
            href="/wall"
            className="hidden sm:inline-flex font-[family-name:var(--font-mono)] text-[11px] font-bold uppercase tracking-widest px-3 py-2 text-paper/70 hover:text-acid rounded-sm"
          >
            wall
          </Link>
          <Link
            href="#upload"
            className="font-[family-name:var(--font-mono)] text-[12px] font-bold uppercase tracking-widest px-3 py-2 bg-acid text-ink rounded-sm hover:-translate-y-0.5 transition"
          >
            start →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative min-h-[100svh] flex items-center pt-32 pb-16 px-5 overflow-hidden border-b border-[var(--line)]">
        <div className="grain" />
        <div className="absolute -top-44 -right-24 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(198,242,78,0.16),transparent_62%)] blur-2xl pointer-events-none" />

        <div className="relative z-[2] max-w-6xl mx-auto w-full grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
          <div>
            <div className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.28em] uppercase opacity-60 mb-5">
              build day · one prototype · ship it live
            </div>
            <h1 className="font-[family-name:var(--font-display)] font-extrabold leading-[0.84] tracking-tighter text-[clamp(56px,14vw,168px)]">
              magic<span className="text-acid">thon</span>
            </h1>
            <p className="font-[family-name:var(--font-display)] font-medium leading-[0.96] tracking-tight text-[clamp(28px,8vw,62px)] mt-4 mb-6">
              Make it a <span className="strike">mess</span> meme.
            </p>
            <p className="max-w-lg text-[17px] leading-relaxed text-paper/80 mb-8">
              Drop a photo. A vision model reads it and pitches six meme ideas
              that fit <em className="not-italic text-acid">that</em> photo. Edit
              live. Ship a link. Watch the laughs land in real time.
            </p>
            <div className="hidden sm:block">
              <UploadDropzone />
            </div>
            <Link
              href="#upload"
              className="sm:hidden inline-block bg-acid text-ink font-[family-name:var(--font-mono)] text-[13px] font-bold uppercase tracking-widest px-5 py-3 rounded-sm"
            >
              start with a photo →
            </Link>
          </div>

          {/* Live demo on the right */}
          <div className="max-w-sm w-full mx-auto lg:mx-0">
            <HeroDemo />
            <p className="mt-4 text-center text-paper/55 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest">
              ↑ these are actual model outputs
            </p>
          </div>
        </div>
      </header>

      {/* MARQUEE */}
      <div className="bg-acid text-ink overflow-hidden py-3 border-b border-[var(--line)]">
        <div className="marquee-track flex w-max whitespace-nowrap font-[family-name:var(--font-display)] font-bold uppercase text-[16px] tracking-tight">
          {[...APHORISMS, ...APHORISMS, ...APHORISMS].map((a, i) => (
            <span key={i} className="px-6 flex items-center gap-6">
              {a}
              <span className="text-[12px]">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* WHAT WE WON'T DO */}
      <section className="px-5 py-20 border-b border-[var(--line)]">
        <div className="max-w-5xl mx-auto">
          <div className="font-[family-name:var(--font-mono)] text-[12px] text-acid tracking-widest mb-3">
            01 / the diff
          </div>
          <h2 className="font-[family-name:var(--font-display)] font-extrabold leading-[0.92] tracking-tighter text-[clamp(36px,7vw,72px)] mb-8">
            The meme maker that doesn&apos;t suck.
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="rounded-lg border border-[var(--line)] p-5 bg-ink-2/40">
              <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/50 mb-3">
                what they give you
              </div>
              <ul className="space-y-2 text-paper/65 text-[15px]">
                <li>✕ Impact font and two text boxes</li>
                <li>✕ Templates from 2009</li>
                <li>✕ Watermark you didn&apos;t ask for</li>
                <li>✕ Captions that fit any photo</li>
                <li>✕ Account walls</li>
              </ul>
            </div>
            <div className="rounded-lg border border-acid/40 p-5 bg-[rgba(198,242,78,0.04)]">
              <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-acid mb-3">
                what magicthon does
              </div>
              <ul className="space-y-2 text-paper/85 text-[15px]">
                <li>✓ A vision model that actually <em className="not-italic text-acid">looks</em> at your photo</li>
                <li>✓ Six photo-specific ideas, six different templates</li>
                <li>✓ A live editor — fonts, layouts, captions, your call</li>
                <li>✓ Shareable links that anyone can react to</li>
                <li>✓ Reactions stream in live</li>
                <li>✓ No sign up. No watermark. Just memes.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-5 py-20 border-b border-[var(--line)]">
        <div className="max-w-5xl mx-auto">
          <div className="font-[family-name:var(--font-mono)] text-[12px] text-acid tracking-widest mb-3">
            02 / the loop
          </div>
          <h2 className="font-[family-name:var(--font-display)] font-extrabold leading-[0.92] tracking-tighter text-[clamp(36px,7vw,72px)] mb-4">
            Six steps. End to end.
          </h2>
          <p className="max-w-xl text-paper/70 mb-10">
            No fake screens. No dead buttons. A meme isn&apos;t finished until
            someone laughs.
          </p>
          <ol className="grid gap-px bg-[var(--line)] border border-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Upload", "Drag, paste, or snap."],
              ["Suggest", "Six photo-aware ideas."],
              ["Pick", "Live previews of all six."],
              ["Edit", "Tactile canvas. Your call."],
              ["Share", "Clean PNG or a link."],
              ["React", "Laughs land in real time."],
            ].map(([title, body], i) => (
              <li key={title} className="bg-ink p-6 relative hover:bg-ink-2 transition">
                <div className="font-[family-name:var(--font-display)] font-extrabold text-[64px] leading-none opacity-15 absolute top-3 right-4">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="font-[family-name:var(--font-display)] font-bold text-2xl mb-1">
                  {title}
                </h3>
                <p className="text-paper/70 text-[15px]">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* LIVE WALL */}
      <section className="px-5 py-20 border-b border-[var(--line)]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <div className="font-[family-name:var(--font-mono)] text-[12px] text-acid tracking-widest mb-3">
                03 / live
              </div>
              <h2 className="font-[family-name:var(--font-display)] font-extrabold leading-[0.92] tracking-tighter text-[clamp(36px,7vw,72px)]">
                Made just now.
              </h2>
            </div>
            <Link
              href="/wall"
              className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/70 hover:text-acid whitespace-nowrap"
            >
              the whole wall →
            </Link>
          </div>
          <Suspense fallback={<div className="h-48 animate-pulse bg-ink-2 rounded-lg" />}>
            <LatestWall limit={6} />
          </Suspense>
        </div>
      </section>

      {/* UPLOAD ANCHOR */}
      <section id="upload" className="px-5 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="font-[family-name:var(--font-mono)] text-[12px] text-acid tracking-widest mb-3">
            04 / your turn
          </div>
          <h2 className="font-[family-name:var(--font-display)] font-extrabold leading-[0.92] tracking-tighter text-[clamp(36px,8vw,72px)] mb-6">
            Drop a photo.
          </h2>
          <UploadDropzone />
        </div>
      </section>

      <footer className="px-5 py-10 border-t border-[var(--line)] text-paper/50 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-center">
        <span>magicthon · build day · hyderabad · 🪳</span>
      </footer>
    </main>
  );
}
