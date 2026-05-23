"use client";

import { useMemo } from "react";
import type { Template } from "@/lib/templates";

type Props = {
  template: Template;
  photo: string;
  captions: Record<string, string>;
  /** Per-slot Y-axis offset in % of container height. */
  positions?: Record<string, { dy: number }>;
  className?: string;
};

function slotStyle(positions: Props["positions"], key: string): React.CSSProperties {
  const p = positions?.[key];
  if (!p?.dy) return {};
  return { transform: `translateY(${p.dy}%)` };
}

// Impact-style outlined caption used by classic memes.
// Size scales down as text gets longer so it never spills outside the frame.
function ImpactText({
  text,
  big = false,
  className = "",
}: {
  text: string;
  big?: boolean;
  className?: string;
}) {
  const len = text.length;
  const size = big
    ? len > 80
      ? "text-[clamp(14px,4cqw,26px)]"
      : len > 50
        ? "text-[clamp(16px,5cqw,32px)]"
        : "text-[clamp(20px,6cqw,44px)]"
    : len > 80
      ? "text-[clamp(12px,3.4cqw,22px)]"
      : len > 50
        ? "text-[clamp(14px,4.2cqw,28px)]"
        : "text-[clamp(18px,5.5cqw,40px)]";
  return (
    <span
      className={`font-[family-name:var(--font-display)] font-extrabold uppercase leading-[0.95] text-white text-center break-words [text-shadow:_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000,_2px_2px_0_#000,_0_0_18px_rgba(0,0,0,.55)] ${size} ${className}`}
    >
      {text}
    </span>
  );
}

export default function MemePreview({
  template,
  photo,
  captions,
  positions,
  className = "",
}: Props) {
  const c = useMemo(() => {
    const out: Record<string, string> = {};
    for (const slot of template.slots) {
      out[slot.key] = captions[slot.key] ?? slot.defaultText ?? "";
    }
    return out;
  }, [template, captions]);

  const isTextMode =
    photo.startsWith("linear-gradient") || photo.startsWith("radial-gradient");

  switch (template.id) {
    case "top-bottom-impact":
      return (
        <Frame className={className}>
          <PhotoLayer src={photo} />
          <div
            data-slot="top"
            style={slotStyle(positions, "top")}
            className="absolute inset-x-0 top-0 flex justify-center px-3 pt-3 touch-none"
          >
            <ImpactText text={c.top} className="max-w-[95%]" />
          </div>
          <div
            data-slot="bottom"
            style={slotStyle(positions, "bottom")}
            className="absolute inset-x-0 bottom-0 flex justify-center px-3 pb-3 touch-none"
          >
            <ImpactText text={c.bottom} className="max-w-[95%]" />
          </div>
        </Frame>
      );

    case "bottom-only":
      return (
        <Frame className={className}>
          <PhotoLayer src={photo} />
          <div
            data-slot="bottom"
            style={slotStyle(positions, "bottom")}
            className="absolute inset-x-0 bottom-0 flex justify-center px-3 pb-4 touch-none"
          >
            <ImpactText text={c.bottom} big className="max-w-[95%]" />
          </div>
        </Frame>
      );

    case "caption-above":
      return (
        <Frame className={className}>
          <div className="bg-white text-ink px-4 py-3 text-[clamp(13px,3.4cqw,18px)] font-[family-name:var(--font-body)] leading-snug">
            {c.caption}
          </div>
          <div className="relative flex-1 min-h-0">
            <PhotoLayer src={photo} />
          </div>
        </Frame>
      );

    case "motivational":
      return (
        <Frame className={`${className} bg-black`}>
          <div className="flex flex-col h-full p-4 sm:p-6">
            {isTextMode ? (
              // No photo: title fills the upper area as the visual hook.
              <div className="relative flex-1 flex items-center justify-center overflow-hidden border-2 border-white/80">
                <PhotoLayer src={photo} />
                <div className="relative z-10 text-center text-white font-[family-name:var(--font-display)] font-extrabold uppercase tracking-[0.18em] leading-none px-4 text-[clamp(28px,9cqw,72px)] [text-shadow:_0_4px_24px_rgba(0,0,0,.5)]">
                  {c.title}
                </div>
              </div>
            ) : (
              <div className="relative flex-1 border-2 border-white/80 bg-black overflow-hidden">
                <PhotoLayer src={photo} className="object-contain p-2" />
              </div>
            )}
            <div className="text-center mt-3 sm:mt-4 text-white">
              {!isTextMode && (
                <div className="font-[family-name:var(--font-display)] font-extrabold uppercase tracking-[0.15em] text-[clamp(20px,6cqw,40px)] leading-none">
                  {c.title}
                </div>
              )}
              <div className="font-[family-name:var(--font-body)] italic text-[clamp(11px,3cqw,16px)] text-white/80 mt-1 px-2 leading-snug">
                {c.subtitle}
              </div>
            </div>
          </div>
        </Frame>
      );

    case "magazine-cover":
      return (
        <Frame className={className}>
          <PhotoLayer src={photo} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />
          <div className="absolute top-2 left-3 right-3 flex items-baseline justify-between">
            <div className="font-[family-name:var(--font-display)] font-extrabold uppercase text-acid text-[clamp(20px,7cqw,44px)] leading-none tracking-tight">
              {c.masthead}
            </div>
            <div className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-white/70">
              vol. ∞
            </div>
          </div>
          <div className="absolute left-3 right-3 bottom-3">
            <div className="font-[family-name:var(--font-display)] font-extrabold text-white text-[clamp(18px,6cqw,40px)] leading-[0.95] tracking-tight">
              {c.headline}
            </div>
            <div className="mt-1 inline-block bg-hot text-white font-[family-name:var(--font-mono)] uppercase tracking-wider text-[clamp(9px,2.5cqw,12px)] px-2 py-1">
              {c.kicker}
            </div>
          </div>
        </Frame>
      );

    case "screenshot-quote":
      return (
        <Frame className={`${className} bg-[#0f0f10]`}>
          <div className="flex flex-col h-full">
            <div className="relative flex-[1.3] min-h-0 m-3 rounded-xl overflow-hidden">
              <PhotoLayer src={photo} />
            </div>
            <div className="mx-3 mb-3 rounded-2xl rounded-tl-md bg-[#1a1a1c] p-3 border border-white/10">
              <div className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-acid mb-1">
                {c.name}
              </div>
              <div className="font-[family-name:var(--font-body)] text-white text-[clamp(12px,3.4cqw,18px)] leading-snug">
                {c.message}
              </div>
            </div>
          </div>
        </Frame>
      );

    case "banner-side": {
      // Scale type down as the banner caption gets longer so it never spills.
      const len = (c.banner ?? "").length;
      const sizeClass =
        len <= 18
          ? "text-[clamp(20px,7cqw,44px)]"
          : len <= 40
            ? "text-[clamp(16px,5.2cqw,32px)]"
            : len <= 70
              ? "text-[clamp(13px,4cqw,24px)]"
              : "text-[clamp(11px,3.2cqw,18px)]";
      return (
        <Frame className={className}>
          <div className="flex h-full">
            <div className="relative flex-[1.6]">
              <PhotoLayer src={photo} />
            </div>
            <div className="flex-1 bg-acid text-ink flex items-center justify-center p-3">
              <div
                className={`font-[family-name:var(--font-display)] font-extrabold uppercase tracking-tight leading-[0.95] break-words text-center ${sizeClass}`}
              >
                {c.banner}
              </div>
            </div>
          </div>
        </Frame>
      );
    }

    default:
      return (
        <Frame className={className}>
          <PhotoLayer src={photo} />
        </Frame>
      );
  }
}

function Frame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-square w-full overflow-hidden rounded-md bg-ink-2 [container-type:inline-size] flex flex-col ${className}`}
    >
      {children}
    </div>
  );
}

function PhotoLayer({
  src,
  className = "",
}: {
  src: string;
  className?: string;
}) {
  // Support text-mode: `src` may be a CSS gradient instead of an image URL.
  if (src.startsWith("linear-gradient") || src.startsWith("radial-gradient")) {
    return (
      <div
        className={`absolute inset-0 w-full h-full ${className}`}
        style={{ background: src }}
        aria-hidden
      />
    );
  }
  return (
    <>
      {/* Shimmer placeholder shown until the image paints. */}
      <div
        className={`absolute inset-0 w-full h-full bg-gradient-to-br from-[#1a1a14] via-[#22221c] to-[#15150f] animate-pulse ${className}`}
        aria-hidden
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-0 ${className}`}
        draggable={false}
        onLoad={(e) => {
          (e.currentTarget as HTMLImageElement).style.opacity = "1";
        }}
        onError={(e) => {
          // On failure, leave the shimmer as the background.
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    </>
  );
}
