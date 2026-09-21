/** Only modern publishable keys are supported; never supply privileged credentials. */
export function getSupabaseConfig() {
  // Explicit property access is required for Next.js browser build-time replacement.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP(S) URL.");
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  if (
    (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== "/"
  ) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be an HTTPS origin (HTTP is allowed for localhost).",
    );
  }
  if (
    !publishableKey.startsWith("sb_publishable_") ||
    publishableKey.length <= "sb_publishable_".length
  ) {
    throw new Error(
      "Use a Supabase publishable key; privileged and legacy keys are not supported here.",
    );
  }

  return { url: parsed.origin, publishableKey };
}
