import Link from "next/link";
import UploadDropzone from "@/components/UploadDropzone";

const APHORISMS = [
  "Ship happens",
  "Console.log is therapy",
  "Merge first, regret later",
  "404: taste not found",
  "localhost:3000 is not a submission",
  "Taste can't be npm installed",
  "Your CSS is showing",
  "Pixels have feelings",
];

export default function Home() {
  return (
    <main className="relative">
      <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-[rgba(12,12,10,0.6)] px-5 py-3 backdrop-blur-md border-b border-[var(--line)]">
        <div className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight">
          <span className="h-2.5 w-2.5 rounded-full bg-acid shadow-[0_0_16px_var(--acid)]" />
          magicthon
        </div>
        <Link
          href="#upload"
          className="font-[family-name:var(--font-mono)] text-[12px] font-bold uppercase tracking-widest px-3 py-2 bg-acid text-ink rounded-sm hover:-translate-y-0.5 transition"
        >
          Start →
        </Link>
      </nav>

      <header className="relative min-h-[100svh] flex items-center pt-32 pb-16 px-5 overflow-hidden border-b border-[var(--line)]">
        <div className="grain" />
        <div className="absolute -top-44 -right-24 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(198,242,78,0.16),transparent_62%)] blur-2xl pointer-events-none" />
        <div className="relative z-[2] max-w-5xl mx-auto w-full">
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
            Upload a photo. A vision model reads it and pitches six meme ideas
            that fit <em className="not-italic text-acid">that</em> photo. You
            pick one, fine-tune it, ship it. Anyone with the link reacts. Live.
          </p>
          <UploadDropzone />
        </div>
      </header>

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

      <section className="px-5 py-24 border-b border-[var(--line)]">
        <div className="max-w-5xl mx-auto">
          <div className="font-[family-name:var(--font-mono)] text-[12px] text-acid tracking-widest mb-3">
            01 / the loop
          </div>
          <h2 className="font-[family-name:var(--font-display)] font-extrabold leading-[0.92] tracking-tighter text-[clamp(36px,8vw,72px)] mb-4">
            Six steps. End to end.
          </h2>
          <p className="max-w-xl text-paper/70 mb-10">
            No fake screens. No dead buttons. A meme isn&apos;t finished until
            someone laughs.
          </p>
          <ol className="grid gap-px bg-[var(--line)] border border-[var(--line)] sm:grid-cols-2">
            {[
              ["Upload", "Drag, paste, or snap a photo."],
              ["Suggest", "Vision LLM proposes six photo-aware ideas."],
              ["Pick", "Six live previews built from your photo."],
              ["Edit", "Tactile canvas. Caption, font, position."],
              ["Share", "Clean PNG or a link. No signup."],
              ["React", "Watch laughs land in real time."],
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

      <section id="upload" className="px-5 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="font-[family-name:var(--font-mono)] text-[12px] text-acid tracking-widest mb-3">
            02 / start
          </div>
          <h2 className="font-[family-name:var(--font-display)] font-extrabold leading-[0.92] tracking-tighter text-[clamp(36px,8vw,72px)] mb-6">
            Drop a photo.
          </h2>
          <UploadDropzone />
        </div>
      </section>

      <footer className="px-5 py-10 border-t border-[var(--line)] text-paper/50 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-center">
        magicthon · build day · made with caffeine
      </footer>
    </main>
  );
}
