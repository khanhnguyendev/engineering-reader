export type Pagefind = {
  init?(): Promise<void>;
  search(q: string): Promise<{
    results: {
      id: string;
      data(): Promise<{ url: string; meta: Record<string, string> }>;
    }[];
  }>;
};

// A variable specifier: the file exists only after `postbuild`, so no bundler or type check may resolve it.
const SRC = "/pagefind/pagefind.js";

let memo: Promise<Pagefind | null> | undefined;

/**
 * Loads the static Pagefind runtime once. A failed load is not remembered, so the next query retries.
 * In production the failure is thrown (the box shows `error`); in dev and test the index is simply
 * absent, so it resolves null (the box shows `unavailable`).
 */
export function loadPagefind(): Promise<Pagefind | null> {
  memo ??= (async () => {
    try {
      const pf: Pagefind = await import(/* webpackIgnore: true */ /* @vite-ignore */ SRC);
      await pf.init?.();
      return pf;
    } catch (e) {
      memo = undefined;
      if (process.env.NODE_ENV === "production") throw e;
      return null;
    }
  })();
  return memo;
}
