const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export type ORContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type ORMessage = {
  role: "system" | "user" | "assistant";
  content: string | ORContent[];
};

export type ORRequest = {
  model: string;
  messages: ORMessage[];
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: "json_object" };
};

export async function callOpenRouter(body: ORRequest): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://magicthon.vercel.app",
      "X-Title": "Magicthon",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (json.error) throw new Error(`OpenRouter error: ${json.error.message}`);
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter: empty response");
  return content;
}

// Models we've vetted on OpenRouter (input modalities include image)
export const MODELS = {
  sonnet: "anthropic/claude-sonnet-4.6",
  opus: "anthropic/claude-opus-4.7",
  sonnetFast: "anthropic/claude-sonnet-4.6", // alias for clarity in callsites
} as const;
