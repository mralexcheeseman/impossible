import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseConfig } from "./config";

afterEach(() => vi.unstubAllEnvs());

function configure(
  url = "https://example.supabase.co",
  key = "sb_publishable_test_only",
) {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", key);
}

describe("public Supabase configuration", () => {
  it("requires configuration only when invoked", () => {
    configure("", "");
    expect(() => getSupabaseConfig()).toThrow("Supabase is not configured");
  });
  it.each([
    ["https://example.supabase.co", ""],
    ["", "sb_publishable_test_only"],
  ])("rejects partial configuration", (url, key) => {
    configure(url, key);
    expect(() => getSupabaseConfig()).toThrow("Supabase is not configured");
  });
  it.each([
    "https://example.supabase.co",
    "http://localhost:54321",
    "http://127.0.0.1:54321",
    "http://[::1]:54321",
  ])("accepts hosted or local origin %s", (url) => {
    configure(url);
    expect(getSupabaseConfig()).toEqual({
      url,
      publishableKey: "sb_publishable_test_only",
    });
  });
  it.each([
    "bad-url",
    "http://remote.example",
    "ftp://example.com",
    "https://user:password@example.com",
    "https://example.com?token=private",
    "https://example.com/path",
    "https://example.com/#private",
  ])("rejects unsafe URL without echoing values: %s", (url) => {
    configure(url);
    try {
      getSupabaseConfig();
      throw new Error("Expected rejection");
    } catch (error) {
      expect((error as Error).message).toContain("NEXT_PUBLIC_SUPABASE_URL");
      expect((error as Error).message).not.toContain(url);
    }
  });
  it.each(["sb_secret_do_not_expose", "legacy.jwt.key", "sb_publishable_"])(
    "rejects unsupported key without echoing it",
    (key) => {
      configure(undefined, key);
      expect(() => getSupabaseConfig()).toThrow(
        "Use a Supabase publishable key",
      );
      try {
        getSupabaseConfig();
      } catch (error) {
        expect((error as Error).message).not.toContain(key);
      }
    },
  );
});
