import { supabaseService, MEMES_BUCKET, publicStorageUrl } from "@/lib/supabase";

const OR_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const IMAGE_MODEL = "google/gemini-2.5-flash-image";

type ORImageResp = {
  choices?: Array<{
    message?: {
      images?: Array<{ image_url?: { url?: string } }>;
    };
  }>;
  error?: { message?: string };
};

/**
 * Generate a single image via OpenRouter (Gemini 2.5 Flash Image) and upload
 * to Supabase Storage. Returns the public URL, or null on failure.
 */
export async function generateAndStoreImage(
  prompt: string,
  key: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(OR_ENDPOINT, {
      method: "POST",
      signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://magicthon-xt95.vercel.app",
        "X-Title": "Magicthon",
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: `Generate a square photographic image, no text or words anywhere in the image: ${prompt}`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ORImageResp;
    const dataUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl || !dataUrl.startsWith("data:image/")) return null;

    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    const contentType = match[1];
    const bytes = Uint8Array.from(Buffer.from(match[2], "base64"));

    const sb = supabaseService();
    if (!sb) return null;
    const ext = contentType.includes("jpeg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
    const path = `text/${key}.${ext}`;
    const up = await sb.storage.from(MEMES_BUCKET).upload(path, bytes, {
      contentType,
      upsert: true,
    });
    if (up.error) return null;
    return publicStorageUrl(path);
  } catch {
    return null;
  }
}
