import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import Home from "./page";

afterEach(() => vi.unstubAllEnvs());

it("renders an honest foundation without database configuration or operational controls", () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
  const html = renderToStaticMarkup(<Home />);
  expect(html).toContain("IMPOSSIBLE");
  expect(html).toContain("No experiment has been started.");
  expect(html).toContain("<main>");
  expect(html).not.toMatch(/<button|<form|START COMPANY/);
});
