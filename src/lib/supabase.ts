import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserClient: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient | null {
  if (!url || !anon) return null;
  if (browserClient) return browserClient;
  browserClient = createClient(url, anon, {
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return browserClient;
}

export function supabaseService(): SupabaseClient | null {
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return null;
  return createClient(url, service, { auth: { persistSession: false } });
}

export const MEMES_BUCKET = "memes";

export function publicStorageUrl(path: string): string {
  if (!url) return "";
  return `${url}/storage/v1/object/public/${MEMES_BUCKET}/${path}`;
}
