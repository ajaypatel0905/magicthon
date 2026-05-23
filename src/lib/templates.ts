// Templates are *recipes*, not images.
// Every template overlays the user's actual photo with a layout + text treatment.

export type TextSlot = {
  key: string;
  label: string;
  defaultText?: string;
  maxChars?: number;
};

export type Template = {
  id: string;
  name: string;
  vibe: string; // short note for the LLM about when to use this
  slots: TextSlot[];
};

export const TEMPLATES: Template[] = [
  {
    id: "top-bottom-impact",
    name: "Classic Impact",
    vibe: "Cursed/loud reaction. Top text sets up, bottom delivers. Use when the photo is the joke.",
    slots: [
      { key: "top", label: "Top text", maxChars: 60 },
      { key: "bottom", label: "Bottom text", maxChars: 70 },
    ],
  },
  {
    id: "bottom-only",
    name: "Bottom Punch",
    vibe: "Modern meme. Single bottom caption. Use when one line is funnier than two.",
    slots: [{ key: "bottom", label: "Caption", maxChars: 90 }],
  },
  {
    id: "caption-above",
    name: "Quote-tweet",
    vibe: "White caption bar above photo. Screenshot/Tumblr energy. Use for observational, dry humor.",
    slots: [{ key: "caption", label: "Caption", maxChars: 140 }],
  },
  {
    id: "motivational",
    name: "Demotivational",
    vibe: "Black-mat poster. TITLE in caps + small subtitle below. Use for ironic life-advice format.",
    slots: [
      { key: "title", label: "Title (one word, all caps)", maxChars: 14 },
      { key: "subtitle", label: "Subtitle", maxChars: 100 },
    ],
  },
  {
    id: "magazine-cover",
    name: "Tabloid",
    vibe: "Magazine headline overlay, masthead + kicker. Use when the photo deserves to be news.",
    slots: [
      { key: "masthead", label: "Masthead", defaultText: "WEEKLY!", maxChars: 12 },
      { key: "headline", label: "Headline", maxChars: 70 },
      { key: "kicker", label: "Kicker line", maxChars: 50 },
    ],
  },
  {
    id: "screenshot-quote",
    name: "Group Chat",
    vibe: "Looks like a chat screenshot under the photo. Use for relatable inner-monologue captions.",
    slots: [
      { key: "name", label: "Sender", defaultText: "me, internally", maxChars: 24 },
      { key: "message", label: "Message", maxChars: 160 },
    ],
  },
  {
    id: "banner-side",
    name: "Acid Banner",
    vibe: "Photo + vertical acid-green banner with bold caption. Use for product-launch energy.",
    slots: [{ key: "banner", label: "Banner text", maxChars: 50 }],
  },
];

export const TEMPLATE_BY_ID: Record<string, Template> = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t]),
);
