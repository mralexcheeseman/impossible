import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

async function makeClient(writable: boolean) {
  const { url, publishableKey } = getSupabaseConfig();
  const cookieStore = await cookies();
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        // Read-only Server Components rely on Proxy to refresh and persist cookies.
        if (!writable) return;
        for (const { name, value, options } of cookiesToSet)
          cookieStore.set(name, value, options);
      },
    },
  });
}
/** Cookie-write errors propagate in Server Actions and Route Handlers. */
export async function createClient() {
  return makeClient(true);
}
export async function createReadOnlyClient() {
  return makeClient(false);
}
