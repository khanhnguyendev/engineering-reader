// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { themeScript } from "@/components/theme-script";

function run({
  stored,
  throws = false,
  osDark,
}: {
  stored?: string;
  throws?: boolean;
  osDark: boolean;
}) {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: q === "(prefers-color-scheme: dark)" ? osDark : false,
  }));
  vi.stubGlobal("localStorage", {
    getItem: () => {
      if (throws) throw new Error("denied");
      return stored ?? null;
    },
  });
  delete document.documentElement.dataset.theme;
  new Function(themeScript())();
  return document.documentElement.dataset.theme;
}

afterEach(() => vi.unstubAllGlobals());

describe("themeScript", () => {
  it("stored light wins over OS dark", () => {
    expect(run({ stored: "light", osDark: true })).toBe("light");
  });
  it("nothing stored follows OS dark", () => {
    expect(run({ osDark: true })).toBe("dark");
  });
  it("throwing localStorage falls back to OS light", () => {
    expect(run({ throws: true, osDark: false })).toBe("light");
  });
});
