import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseService } from "@/lib/supabase";
import { TEMPLATE_BY_ID } from "@/lib/templates";
import MemeViewer from "@/components/MemeViewer";
import type { SlotAdjust } from "@/components/MemePreview";

export const dynamic = "force-dynamic";

function siteUrl(): string {
  // Prefer the env Vercel sets automatically.
  const v = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (v) return `https://${v}`;
  return "https://magicthon-xt95.vercel.app";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const ogUrl = `${siteUrl()}/api/og/${encodeURIComponent(code)}`;
  const shareUrl = `${siteUrl()}/m/${encodeURIComponent(code)}`;
  const sb = supabaseService();
  let title = "magicthon · a meme";
  let description = "Made on magicthon. Drop a photo, get memes, ship a link.";
  if (sb) {
    const q = await sb
      .from("memes")
      .select("captions, observations")
      .eq("code", code.toLowerCase())
      .single();
    if (q.data) {
      const caps = q.data.captions as Record<string, string>;
      const firstLine =
        caps.top || caps.headline || caps.title || caps.banner || caps.caption || caps.message || "";
      if (firstLine) title = `magicthon · ${firstLine.slice(0, 70)}`;
      if (Array.isArray(q.data.observations) && q.data.observations.length) {
        description = `${(q.data.observations as string[]).join(" · ").slice(0, 180)}`;
      }
    }
  }
  return {
    title,
    description,
    openGraph: {
      type: "website",
      url: shareUrl,
      title,
      description,
      siteName: "magicthon",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

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
        <div className="flex items-center justify-end">
          <Link
            href="/"
            className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest text-paper/60 hover:text-acid"
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
          positions={(meme.positions ?? {}) as Record<string, SlotAdjust>}
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
