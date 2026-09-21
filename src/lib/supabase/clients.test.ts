import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CookieOptions } from "@supabase/ssr";

const mocks = vi.hoisted(() => ({
  browser: vi.fn(),
  server: vi.fn(),
  cookies: vi.fn(),
  getAll: vi.fn(),
  set: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: mocks.browser,
  createServerClient: mocks.server,
}));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));

import { createClient as browserClient } from "./client";
import { createClient as serverClient } from "./server";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "sb_publishable_test_only",
  );
  mocks.cookies.mockResolvedValue({ getAll: mocks.getAll, set: mocks.set });
});
afterEach(() => vi.unstubAllEnvs());

describe("Supabase setup boundaries", () => {
  it("creates the browser client with public configuration", () => {
    const client = {};
    mocks.browser.mockReturnValue(client);
    expect(browserClient()).toBe(client);
    expect(mocks.browser).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "sb_publishable_test_only",
    );
  });
  it("forwards request cookies and every cookie option to the writable server context", async () => {
    const client = {};
    mocks.server.mockReturnValue(client);
    const incoming = [{ name: "session", value: "test-value" }];
    mocks.getAll.mockReturnValue(incoming);
    expect(await serverClient()).toBe(client);
    expect(mocks.server).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "sb_publishable_test_only",
      expect.any(Object),
    );
    const adapter = mocks.server.mock.calls[0][2].cookies;
    expect(adapter.getAll()).toEqual(incoming);
    const options: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 120,
    };
    adapter.setAll([
      { name: "session", value: "refreshed", options },
      { name: "old", value: "", options: { maxAge: 0 } },
    ]);
    expect(mocks.set).toHaveBeenNthCalledWith(
      1,
      "session",
      "refreshed",
      options,
    );
    expect(mocks.set).toHaveBeenNthCalledWith(2, "old", "", { maxAge: 0 });
  });
  it("does not swallow cookie write failures", async () => {
    await serverClient();
    mocks.set.mockImplementation(() => {
      throw new Error("Read-only cookie context");
    });
    expect(() =>
      mocks.server.mock.calls[0][2].cookies.setAll([
        { name: "session", value: "test", options: {} },
      ]),
    ).toThrow("Read-only cookie context");
  });
  it("never creates clients with missing configuration", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(() => browserClient()).toThrow();
    await expect(serverClient()).rejects.toThrow();
    expect(mocks.browser).not.toHaveBeenCalled();
    expect(mocks.server).not.toHaveBeenCalled();
    expect(mocks.cookies).not.toHaveBeenCalled();
  });
  it("acquires a fresh server cookie context for each request", async () => {
    await serverClient();
    await serverClient();
    expect(mocks.cookies).toHaveBeenCalledTimes(2);
    expect(mocks.server).toHaveBeenCalledTimes(2);
  });
});
