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
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      if (throws) throw new Error("denied");
      return { getItem: () => stored ?? null };
    },
  });
  delete document.documentElement.dataset.theme;
  new Function(themeScript())();
  return document.documentElement.dataset.theme;
}

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
});

describe("themeScript", () => {
  it("stored light wins over OS dark", () => {
    expect(run({ stored: "light", osDark: true })).toBe("light");
  });
  it("stored dark wins over OS light", () => {
    expect(run({ stored: "dark", osDark: false })).toBe("dark");
  });
  it("nothing stored follows OS dark", () => {
    expect(run({ osDark: true })).toBe("dark");
  });
  it("throwing localStorage falls back to OS light", () => {
    expect(run({ throws: true, osDark: false })).toBe("light");
  });
});
