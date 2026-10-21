const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function isSupabaseConfigured() {
  return Boolean(url && publishableKey);
}

export function getSupabaseConfig() {
  if (!url || !publishableKey) throw new Error("Supabase is not configured.");
  return { url, publishableKey };
}
