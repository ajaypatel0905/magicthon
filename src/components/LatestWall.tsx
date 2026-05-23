import Link from "next/link";
import MemePreview from "@/components/MemePreview";
import { supabaseService } from "@/lib/supabase";
import { TEMPLATE_BY_ID } from "@/lib/templates";

type Row = {
  code: string;
  photo_url: string;
  template_id: string;
  captions: Record<string, string>;
};

export default async function LatestWall({ limit = 6 }: { limit?: number }) {
  const sb = supabaseService();
  if (!sb) return null;

  const q = await sb
    .from("memes")
    .select("code, photo_url, template_id, captions")
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (q.data as Row[] | null) ?? [];
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--line)] py-12 text-center text-paper/50 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-widest">
        no memes yet · be the first one
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {rows.map((r) => {
        const tpl = TEMPLATE_BY_ID[r.template_id];
        if (!tpl) return null;
        return (
          <Link
            key={r.code}
            href={`/m/${r.code}`}
            className="block rounded-lg overflow-hidden ring-1 ring-[var(--line)] hover:ring-acid/60 transition"
          >
            <MemePreview
              template={tpl}
              photo={r.photo_url}
              captions={r.captions}
            />
          </Link>
        );
      })}
    </div>
  );
}
