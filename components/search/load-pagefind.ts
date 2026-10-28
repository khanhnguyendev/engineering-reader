import type { Locale } from "@/lib/i18n";
import { EARLY_KEY } from "@/lib/search-preload";

export type Pagefind = {
  init?(): Promise<void>;
  destroy?(): Promise<void>;
  search(q: string): Promise<{
    results: {
      id: string;
      data(): Promise<{ url: string; meta: Record<string, string> }>;
    }[];
  }>;
};

// A variable specifier: the file exists only after `prebuild` (`pnpm search-index`), so no bundler or type check may resolve it.
const SRC = "/pagefind/pagefind.js";

/** The runtime the search page started from its inline script, taken once; undefined when there is none. */
export function takeEarlyPagefind(): Promise<Pagefind | null> | undefined {
  const w = globalThis as unknown as Record<string, Promise<Pagefind | null> | undefined>;
  const early = w[EARLY_KEY];
  delete w[EARLY_KEY];
  return early;
}

let memo: { locale: Locale; promise: Promise<Pagefind | null>; token: object } | undefined;

/**
 * Loads the static Pagefind runtime. Pagefind picks its index language once, in `init`, from
 * `<html lang>`; a client-side locale switch keeps the module alive, so a change of locale tears the
 * instance down (`destroy`) and `init`s again, which re-reads the new language. The memo is keyed by
 * locale. A failed load is not remembered, so the next query retries. In production the failure is
 * thrown (the box shows `error`); in dev and test the index is simply absent, so it resolves null.
 */
export function loadPagefind(locale: Locale): Promise<Pagefind | null> {
  if (memo?.locale === locale) return memo.promise;
  const previous = memo?.promise;
  const token = {};
  const promise: Promise<Pagefind | null> = (async () => {
    try {
      const loaded = previous ? await previous.catch(() => null) : null;
      if (loaded) {
        await loaded.destroy?.();
        await loaded.init?.();
        return loaded;
      }
      const early = await takeEarlyPagefind();
      if (early) return early;
      const pf: Pagefind = await import(/* webpackIgnore: true */ /* @vite-ignore */ SRC);
      await pf.init?.();
      return pf;
    } catch (e) {
      if (memo?.token === token) memo = undefined;
      if (process.env.NODE_ENV === "production") throw e;
      return null;
    }
  })();
  memo = { locale, promise, token };
  return promise;
}
