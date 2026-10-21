import { describe, expect, it, vi } from "vitest";
import { fmt, otherLocale, switchHref } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionaries";

// "server-only" is resolved by Next's bundler; under vitest it is an empty module.
vi.mock("server-only", () => ({}));

function keyPaths(o: unknown, prefix = ""): string[] {
  if (typeof o !== "object" || o === null) return [prefix];
  return Object.entries(o).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("dictionaries", () => {
  it("have identical deep key sets", () => {
    const vi_ = keyPaths(getDictionary("vi")).sort();
    const en = keyPaths(getDictionary("en")).sort();
    expect(vi_.length).toBeGreaterThan(20);
    expect(en).toEqual(vi_);
  });
});

describe("fmt", () => {
  it("replaces {n}", () => {
    expect(fmt("{n} phút", { n: 3 })).toBe("3 phút");
  });
});

describe("otherLocale", () => {
  it("flips both ways", () => {
    expect(otherLocale("vi")).toBe("en");
    expect(otherLocale("en")).toBe("vi");
  });
});

describe("switchHref", () => {
  it("maps the locale root", () => {
    expect(switchHref("/vi", "vi")).toBe("/en");
    expect(switchHref("/vi/", "vi")).toBe("/en");
  });
  it("keeps the rest of the path", () => {
    expect(switchHref("/en/posts/x", "en")).toBe("/vi/posts/x");
  });
  it("falls back to the other locale home when the twin is missing", () => {
    expect(switchHref("/vi/posts/x", "vi", true)).toBe("/en");
  });
});
