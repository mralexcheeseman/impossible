import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ create: vi.fn(), user: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.create }));
import { proxy } from "./proxy";
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "sb_publishable_test_only",
  );
  mocks.create.mockReturnValue({ auth: { getUser: mocks.user } });
});
afterEach(() => vi.unstubAllEnvs());
it("redirects unauthenticated private requests and preserves rotated cookies", async () => {
  mocks.user.mockImplementation(async () => {
    mocks.create.mock.calls[0][2].cookies.setAll(
      [{ name: "session", value: "rotated-test", options: { httpOnly: true } }],
      { "Cache-Control": "private, no-store" },
    );
    return { data: { user: null }, error: null };
  });
  const response = await proxy(new NextRequest("http://localhost/control"));
  expect(response.headers.get("location")).toBe("http://localhost/login");
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.cookies.get("session")?.value).toBe("rotated-test");
});
it("refreshes authenticated requests without caching private data", async () => {
  mocks.user.mockResolvedValue({
    data: { user: { id: "operator" } },
    error: null,
  });
  const response = await proxy(new NextRequest("http://localhost/control"));
  expect(response.headers.get("location")).toBeNull();
  expect(response.headers.get("cache-control")).toContain("no-store");
});
it("does not expose control routes when configuration is missing", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  const response = await proxy(new NextRequest("http://localhost/control"));
  expect(response.headers.get("location")).toBe("http://localhost/login");
  expect(mocks.create).not.toHaveBeenCalled();
});
