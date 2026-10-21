import { describe, expect, it, vi } from "vitest";
import { fmt, otherLocale, plural, switchHref } from "@/lib/i18n";
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

  it("carry the M2 wayfinding keys in both locales", () => {
    const required = [
      "home.intro", "home.startHere", "home.latest", "home.byCompany", "home.byTopic", "home.all",
      "companies.title", "companies.dek", "companies.postsOne", "companies.postsOther",
      "companies.empty", "companies.blog",
      "topics.title", "topics.dek", "topics.empty",
      "topics.shelf.distributed-systems", "topics.shelf.data", "topics.shelf.realtime",
      "topics.shelf.infra", "topics.shelf.reliability",
      "tags.title", "tags.dek", "tags.empty", "list.posts",
      "series.title", "series.part", "series.prev", "series.next", "series.index",
      "related.title", "about.title", "about.dek",
      "notFound.title", "notFound.body", "notFound.home",
    ];
    for (const l of ["vi", "en"] as const) {
      const keys = new Set(keyPaths(getDictionary(l)));
      for (const k of required) expect(keys, `${l}: ${k}`).toContain(k);
    }
    expect(getDictionary("en").series.part).toBe("Part {i} of {n}");
    expect(getDictionary("vi").series.part).toBe("Phần {i}/{n}");
    expect(getDictionary("en").home.all).toBe("All →");
    expect(getDictionary("vi").home.all).toBe("Tất cả →");
  });
});

describe("plural", () => {
  it("picks one/other by Intl.PluralRules in en", () => {
    const d = getDictionary("en").companies;
    expect(plural("en", 1, d.postsOne, d.postsOther)).toBe("1 post");
    expect(plural("en", 3, d.postsOne, d.postsOther)).toBe("3 posts");
  });
  it("probes the selected form: en 1 is one, en 0 and 2 are other", () => {
    expect(plural("en", 1, "ONE", "OTHER")).toBe("ONE");
    expect(plural("en", 0, "ONE", "OTHER")).toBe("OTHER");
    expect(plural("en", 2, "ONE", "OTHER")).toBe("OTHER");
  });
  it("probes the selected form: vi is always other", () => {
    expect(plural("vi", 1, "ONE", "OTHER")).toBe("OTHER");
    expect(plural("vi", 0, "ONE", "OTHER")).toBe("OTHER");
    expect(plural("vi", 2, "ONE", "OTHER")).toBe("OTHER");
  });
  it("uses the other form for every n in vi", () => {
    const d = getDictionary("vi").companies;
    expect(plural("vi", 1, d.postsOne, d.postsOther)).toBe("1 bài");
    expect(plural("vi", 3, d.postsOne, d.postsOther)).toBe("3 bài");
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
