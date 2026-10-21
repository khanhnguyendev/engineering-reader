import { describe, expect, it } from "vitest";
import { fmt, getDictionary, otherLocale } from "@/lib/i18n";

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
