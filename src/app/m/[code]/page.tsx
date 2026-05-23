import Link from "next/link";

export default async function MemePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <main className="min-h-[100svh] px-5 py-10">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/60 hover:text-acid"
        >
          ← magicthon
        </Link>
        <div className="mt-6 rounded-lg border border-[var(--line)] bg-ink-2 p-6">
          <div className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/60 mb-2">
            magicthon / m / {code}
          </div>
          <div className="aspect-square w-full rounded bg-gradient-to-br from-[#2a2f3f] to-[#15150f] flex items-center justify-center text-paper/40">
            meme render lands here
          </div>
          <div className="mt-4 flex gap-2">
            {["😂", "💀", "🔥"].map((e) => (
              <button
                key={e}
                disabled
                className="rounded-full border border-[var(--line)] px-3 py-1 text-sm bg-ink-2"
              >
                {e} 0
              </button>
            ))}
          </div>
        </div>
        <p className="mt-6 text-paper/60 text-sm">
          Stub. Realtime reactions wire up next.
        </p>
      </div>
    </main>
  );
}
