import Link from "next/link";
import LatestWall from "@/components/LatestWall";

export const dynamic = "force-dynamic";

export default function WallPage() {
  return (
    <main className="min-h-[100svh] px-4 sm:px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/60 hover:text-acid"
        >
          ← magicthon
        </Link>
        <h1 className="font-[family-name:var(--font-display)] font-extrabold leading-[0.92] tracking-tighter text-[clamp(40px,8vw,86px)] mt-4 mb-3">
          The wall.
        </h1>
        <p className="text-paper/70 mb-10 max-w-xl">
          Every meme made today. Latest on top. Tap one to react.
        </p>
        <LatestWall limit={36} />
      </div>
    </main>
  );
}
