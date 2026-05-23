"use client";

import { useMemo } from "react";
import type { Template } from "@/lib/templates";

type Props = {
  template: Template;
  photo: string;
  captions: Record<string, string>;
  className?: string;
};

// Impact-style outlined caption used by classic memes
function ImpactText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <span
      className={`font-[family-name:var(--font-display)] font-extrabold uppercase leading-[0.95] text-white text-center [text-shadow:_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000,_2px_2px_0_#000,_0_0_18px_rgba(0,0,0,.55)] ${className}`}
    >
      {text}
    </span>
  );
}

export default function MemePreview({
  template,
  photo,
  captions,
  className = "",
}: Props) {
  const c = useMemo(() => {
    const out: Record<string, string> = {};
    for (const slot of template.slots) {
      out[slot.key] = captions[slot.key] ?? slot.defaultText ?? "";
    }
    return out;
  }, [template, captions]);

  switch (template.id) {
    case "top-bottom-impact":
      return (
        <Frame className={className}>
          <PhotoLayer src={photo} />
          <div className="absolute inset-x-0 top-0 flex justify-center px-3 pt-3">
            <ImpactText text={c.top} className="text-[clamp(18px,5.5cqw,40px)] max-w-[95%]" />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex justify-center px-3 pb-3">
            <ImpactText text={c.bottom} className="text-[clamp(18px,5.5cqw,40px)] max-w-[95%]" />
          </div>
        </Frame>
      );

    case "bottom-only":
      return (
        <Frame className={className}>
          <PhotoLayer src={photo} />
          <div className="absolute inset-x-0 bottom-0 flex justify-center px-3 pb-4">
            <ImpactText text={c.bottom} className="text-[clamp(20px,6cqw,44px)] max-w-[95%]" />
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
            <div className="relative flex-1 border-2 border-white/80 bg-black overflow-hidden">
              <PhotoLayer src={photo} className="object-contain p-2" />
            </div>
            <div className="text-center mt-3 sm:mt-4 text-white">
              <div className="font-[family-name:var(--font-display)] font-extrabold uppercase tracking-[0.15em] text-[clamp(20px,6cqw,40px)] leading-none">
                {c.title}
              </div>
              <div className="font-[family-name:var(--font-body)] italic text-[clamp(11px,3cqw,16px)] text-white/80 mt-1">
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

    case "banner-side":
      return (
        <Frame className={className}>
          <div className="flex h-full">
            <div className="relative flex-[1.6]">
              <PhotoLayer src={photo} />
            </div>
            <div className="flex-1 bg-acid text-ink flex items-center justify-center p-3">
              <div className="font-[family-name:var(--font-display)] font-extrabold uppercase tracking-tight text-[clamp(16px,5cqw,36px)] leading-[0.95] [writing-mode:horizontal-tb]">
                {c.banner}
              </div>
            </div>
          </div>
        </Frame>
      );

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
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={`absolute inset-0 w-full h-full object-cover ${className}`}
      draggable={false}
    />
  );
}
