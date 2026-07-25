import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Singleton Supabase client for use in browser-side components/hooks. */
export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // TEMPORARY DIAGNOSTIC — remove once the %09 corruption is found.
    // Logs the exact first/last characters (as escaped JSON) so hidden
    // whitespace/control characters are visible instead of invisible.
    console.warn("[LiveBite debug] VITE_SUPABASE_URL:", JSON.stringify(url));
    console.warn(
      "[LiveBite debug] VITE_SUPABASE_ANON_KEY first 15 chars:",
      JSON.stringify(key?.slice(0, 15)),
    );
    console.warn(
      "[LiveBite debug] VITE_SUPABASE_ANON_KEY length:",
      key?.length,
      "(a correctly-copied anon key should be ~215-230 chars, starting with eyJ)",
    );

    browserClient = createBrowserClient<Database>(url, key);
  }
  return browserClient;
}
