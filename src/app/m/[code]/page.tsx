import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseService } from "@/lib/supabase";
import { TEMPLATE_BY_ID } from "@/lib/templates";
import MemeViewer from "@/components/MemeViewer";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";

export default async function MemePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const sb = supabaseService();
  if (!sb) {
    return (
      <main className="px-5 py-10 max-w-2xl mx-auto">
        <p>Storage not configured.</p>
      </main>
    );
  }

  const memeQ = await sb
    .from("memes")
    .select("id, code, photo_url, template_id, captions, positions, observations, created_at")
    .eq("code", code.toLowerCase())
    .single();

  if (memeQ.error || !memeQ.data) notFound();
  const meme = memeQ.data;
  const tpl = TEMPLATE_BY_ID[meme.template_id];
  if (!tpl) notFound();

  const reactQ = await sb
    .from("reactions")
    .select("emoji")
    .eq("meme_id", meme.id);
  const initialCounts: Record<string, number> = {};
  for (const r of reactQ.data ?? []) {
    initialCounts[r.emoji] = (initialCounts[r.emoji] ?? 0) + 1;
  }

  return (
    <main className="min-h-[100svh] px-4 py-8 sm:py-12">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <BackButton fallbackHref="/" label="← back" />
          <Link
            href="/"
            className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/45 hover:text-acid"
          >
            magicthon
          </Link>
        </div>

        <div className="mt-6 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-paper/50">
          magicthon / m / {meme.code}
        </div>

        <MemeViewer
          memeId={meme.id}
          template={tpl}
          photoUrl={meme.photo_url}
          captions={meme.captions as Record<string, string>}
          positions={(meme.positions ?? {}) as Record<string, { dy: number }>}
          initialCounts={initialCounts}
          code={meme.code}
        />

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block bg-acid text-ink font-[family-name:var(--font-mono)] text-[13px] font-bold uppercase tracking-widest px-4 py-2 rounded-sm"
          >
            make your own →
          </Link>
        </div>
      </div>
    </main>
  );
}
