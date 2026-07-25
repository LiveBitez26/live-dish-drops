import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import type { Database } from "./types";

/**
 * Request-scoped Supabase client — respects the signed-in user's session via
 * cookies, and is subject to RLS. Use this inside server functions / API
 * routes for anything done "as the current user".
 */
export function getSupabaseServerClient() {
  return createServerClient<Database>(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieHeader = getRequestHeader("Cookie") ?? "";
          return parseCookieHeader(cookieHeader);
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            setResponseHeader(
              "Set-Cookie",
              serializeCookieHeader(name, value, options),
            );
          });
        },
      },
    },
  );
}

/**
 * Admin client using the SERVICE ROLE key. Bypasses RLS entirely.
 * NEVER import this into client-side code or expose the key to the browser.
 * Use only inside trusted server-only files (webhooks, admin server fns).
 */
export function getSupabaseAdminClient() {
  return createClient<Database>(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
