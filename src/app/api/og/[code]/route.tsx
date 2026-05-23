import { ImageResponse } from "next/og";
import { supabaseService } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 1200x630 — standard OG / Twitter card.
const WIDTH = 1200;
const HEIGHT = 630;

const IMPACT_SHADOW =
  "-3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000, 0 0 24px rgba(0,0,0,0.55)";

function impactStyle(fontSize: number): React.CSSProperties {
  return {
    fontFamily: "system-ui, sans-serif",
    fontWeight: 900,
    color: "white",
    textTransform: "uppercase",
    textAlign: "center",
    lineHeight: 1,
    letterSpacing: "-0.01em",
    textShadow: IMPACT_SHADOW,
    fontSize,
    maxWidth: "92%",
    overflowWrap: "break-word",
  };
}

function autoSize(text: string, big: number, medium: number, small: number): number {
  const len = text.length;
  if (len <= 32) return big;
  if (len <= 70) return medium;
  return small;
}

function isGradient(s: string): boolean {
  return s.startsWith("linear-gradient") || s.startsWith("radial-gradient");
}

function PhotoBg({ src }: { src: string }) {
  if (isGradient(src)) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: src,
          display: "flex",
        }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={WIDTH}
      height={HEIGHT}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  );
}

function Brand() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 18,
        right: 24,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "system-ui, sans-serif",
        fontSize: 18,
        fontWeight: 700,
        color: "#c6f24e",
        textTransform: "uppercase",
        letterSpacing: "0.18em",
        textShadow: "0 2px 12px rgba(0,0,0,0.7)",
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          background: "#c6f24e",
          boxShadow: "0 0 14px #c6f24e",
        }}
      />
      magicthon
    </div>
  );
}

function MemeFrame({
  photoUrl,
  templateId,
  captions,
}: {
  photoUrl: string;
  templateId: string;
  captions: Record<string, string>;
}) {
  // Most templates: use top/bottom Impact overlay on the photo. The few
  // structured-layout templates (motivational, magazine, screenshot-quote,
  // caption-above, banner-side) get a simplified flatten — photo + biggest
  // caption as a banner — because the OG renderer can't reproduce their full
  // layout faithfully.
  const top = captions.top ?? "";
  const bottom = captions.bottom ?? "";
  const banner = captions.banner ?? "";
  const headline = captions.headline ?? "";
  const masthead = captions.masthead ?? "";
  const caption = captions.caption ?? "";
  const title = captions.title ?? "";
  const subtitle = captions.subtitle ?? "";
  const message = captions.message ?? "";

  const primaryLine =
    top ||
    title ||
    masthead ||
    headline ||
    banner ||
    caption ||
    message ||
    "";
  const secondaryLine =
    (top && bottom) ? bottom :
    (title && subtitle) ? subtitle :
    (headline && masthead) ? headline :
    "";

  return (
    <div
      style={{
        position: "relative",
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        background: "#0c0c0a",
      }}
    >
      <PhotoBg src={photoUrl} />

      {/* Dark gradient veils for legibility */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.0) 70%, rgba(0,0,0,0.6) 100%)",
          display: "flex",
        }}
      />

      {/* Top caption */}
      {primaryLine && (
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            padding: "0 32px",
          }}
        >
          <span style={impactStyle(autoSize(primaryLine, 80, 56, 40))}>
            {primaryLine}
          </span>
        </div>
      )}

      {/* Bottom caption */}
      {secondaryLine && (
        <div
          style={{
            position: "absolute",
            bottom: 70,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            padding: "0 32px",
          }}
        >
          <span style={impactStyle(autoSize(secondaryLine, 76, 52, 36))}>
            {secondaryLine}
          </span>
        </div>
      )}

      <Brand />
      {/* Template tag in corner */}
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 24,
          display: "flex",
          fontFamily: "system-ui, sans-serif",
          fontSize: 14,
          fontWeight: 700,
          color: "rgba(255,255,255,0.7)",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          textShadow: "0 2px 12px rgba(0,0,0,0.7)",
        }}
      >
        {templateId.replace(/-/g, " ")}
      </div>
    </div>
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const sb = supabaseService();

  // Fallback OG: brand-only.
  const fallback = (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 30% 40%, rgba(198,242,78,0.18), transparent 60%), #0c0c0a",
        fontFamily: "system-ui, sans-serif",
        color: "#f4f1e8",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 160,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 0.9,
          }}
        >
          magic<span style={{ color: "#c6f24e" }}>thon</span>
        </div>
        <div
          style={{
            fontSize: 28,
            color: "rgba(244,241,232,0.7)",
          }}
        >
          memes that actually land
        </div>
      </div>
    </div>
  );

  if (!sb) {
    return new ImageResponse(fallback, { width: WIDTH, height: HEIGHT });
  }

  const q = await sb
    .from("memes")
    .select("photo_url, template_id, captions")
    .eq("code", code.toLowerCase())
    .single();

  if (q.error || !q.data) {
    return new ImageResponse(fallback, { width: WIDTH, height: HEIGHT });
  }

  return new ImageResponse(
    (
      <MemeFrame
        photoUrl={q.data.photo_url}
        templateId={q.data.template_id}
        captions={q.data.captions as Record<string, string>}
      />
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      },
    },
  );
}
