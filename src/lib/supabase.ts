import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let client: SupabaseClient | null = null;

/** Service-role client. SERVER ONLY — bypasses RLS. */
export function supabaseAdmin(): SupabaseClient {
  if (client) return client;
  client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": "garbaverse" } },
  });
  return client;
}
