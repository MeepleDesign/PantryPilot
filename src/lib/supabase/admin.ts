import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for server contexts with no signed-in user (Stripe
 * webhooks). Bypasses RLS — never expose this to the browser or use it for
 * anything driven by untrusted request input beyond what the caller has
 * already verified (e.g. a Stripe signature).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role is not configured.");

  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
