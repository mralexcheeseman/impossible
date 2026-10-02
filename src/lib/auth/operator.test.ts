import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  writable: vi.fn(),
  readonly: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.writable,
  createReadOnlyClient: mocks.readonly,
}));
import { requireOperator } from "./operator";
beforeEach(() => {
  vi.resetAllMocks();
  const client = { auth: { getUser: mocks.getUser }, rpc: mocks.rpc };
  mocks.writable.mockResolvedValue(client);
  mocks.readonly.mockResolvedValue(client);
});
describe("operator authorisation", () => {
  it("rejects a missing or unverified user before consulting permissions", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("invalid token"),
    });
    await expect(requireOperator()).rejects.toThrow("redirect:/login");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each([
    { data: false, error: null },
    { data: true, error: new Error("database unavailable") },
  ])(
    "fails closed for absent membership or permission lookup failures",
    async (access) => {
      mocks.getUser.mockResolvedValue({
        data: { user: { id: "user", user_metadata: { operator: true } } },
        error: null,
      });
      mocks.rpc.mockResolvedValue(access);
      await expect(requireOperator()).rejects.toThrow(
        "redirect:/login?error=access",
      );
    },
  );
  it("verifies both identity and database membership for writes", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "operator" } },
      error: null,
    });
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    await requireOperator(true);
    expect(mocks.writable).toHaveBeenCalledOnce();
    expect(mocks.rpc).toHaveBeenCalledWith("is_operator");
  });
});
