"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CHIP_LINK, CHIP_MUTED } from "@/components/chip";
import { Monogram } from "@/components/monogram";
import { loadPagefind } from "@/components/search/load-pagefind";
import type { Dictionary } from "@/lib/dictionaries";
import { toSitePath } from "@/lib/fold";
import { plural, type Locale } from "@/lib/i18n";

type State = "idle" | "loading" | "results" | "empty" | "unavailable" | "error";
type Row = {
  url: string;
  title: string;
  summary: string;
  company: string;
  companyId: string;
  keyValue: string;
  keyLabel: string;
};
type CompanyRef = { slug: string; name: string; brandColor?: string };
type TopicRef = { slug: string; label: string; count: number };

const DEBOUNCE_MS = 200;
const MAX_ROWS = 10;
const MIN_CHARS = 2;

/** Search over the static Pagefind index. Rows come from result metadata, never from excerpts. */
export function SearchBox({
  locale,
  t,
  list,
  companies,
  topics,
}: {
  locale: Locale;
  t: Dictionary["search"];
  list: Pick<Dictionary["list"], "postsOne" | "postsOther">;
  companies: CompanyRef[];
  topics: TopicRef[];
}) {
  const id = useId();
  const [q, setQ] = useState("");
  const [state, setState] = useState<State>("idle");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const run = useRef(0);

  // The ?q= value seeds the box once, after hydration.
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("q");
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the URL is only possible after mount
      setQ(initial);
      // A deep link searches right away, so the idle browse block must never render for it.
      if (initial.trim().length >= MIN_CHARS) setState("loading");
    }
  }, []);

  useEffect(() => {
    const term = q.trim();
    const mine = ++run.current;
    if (term.length < MIN_CHARS) return;
    const timer = setTimeout(async () => {
      setState("loading");
      try {
        const pf = await loadPagefind(locale);
        if (run.current !== mine) return;
        if (!pf) {
          setState("unavailable");
          return;
        }
        const found = await pf.search(term);
        const data = await Promise.all(found.results.slice(0, MAX_ROWS).map((r) => r.data()));
        if (run.current !== mine) return;
        setTotal(found.results.length);
        setRows(
          data.map((d) => ({
            url: toSitePath(d.url),
            title: d.meta.title ?? "",
            summary: d.meta.summary ?? "",
            company: d.meta.company ?? "",
            companyId: d.meta.companyId ?? "",
            keyValue: d.meta.keyValue ?? "",
            keyLabel: d.meta.keyLabel ?? "",
          })),
        );
        setState(found.results.length === 0 ? "empty" : "results");
      } catch {
        if (run.current === mine) setState("error");
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q, locale]);

  function onChange(value: string) {
    setQ(value);
    const term = value.trim();
    if (term.length < MIN_CHARS) {
      setState("idle");
      setRows([]);
      setTotal(0);
    }
    const { pathname, hash } = window.location;
    window.history.replaceState(null, "", `${pathname}${term ? `?q=${encodeURIComponent(term)}` : ""}${hash}`);
  }

  // Below the minimum length nothing is shown, whatever the last search left behind.
  const view: State = q.trim().length < MIN_CHARS ? "idle" : state;
  const message: Record<State, string> = {
    idle: "",
    loading: t.searching,
    results: plural(locale, total, t.countOne, t.countOther),
    empty: t.empty,
    unavailable: t.unavailable,
    error: t.error,
  };

  return (
    <div data-search-state={view}>
      <label htmlFor={id} className="sr-only">
        {t.label}
      </label>
      <input
        id={id}
        type="search"
        value={q}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.placeholder}
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-panel border border-hairline-strong bg-panel px-4 py-3 text-[17px] leading-[1.4] text-ink caret-[var(--accent)] placeholder:text-muted [&::-webkit-search-cancel-button]:appearance-none"
      />
      <p aria-live="polite" className={view === "idle" ? "" : "mono-label mt-4 min-h-[1.5em] text-muted"}>
        {message[view]}
      </p>
      {view === "idle" && topics.length > 0 && (
        <div data-search-browse className="mt-3">
          <p className="text-[15px] leading-[1.55] text-ink-2">{t.browse}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {topics.map((tp) => {
              const n = (
                <span className="font-mono text-xs">
                  <span aria-hidden="true">{tp.count}</span>
                  <span className="sr-only">{plural(locale, tp.count, list.postsOne, list.postsOther)}</span>
                </span>
              );
              return (
                <li key={tp.slug}>
                  {tp.count > 0 ? (
                    <a href={`/${locale}/topics/${tp.slug}`} className={CHIP_LINK}>
                      {tp.label}
                      <span className="text-muted">{n}</span>
                    </a>
                  ) : (
                    <span className={CHIP_MUTED}>
                      {tp.label}
                      {n}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {(view === "results" || (view === "loading" && rows.length > 0)) && (
        <ol data-search-results className="mt-2 border-b border-hairline">
          {rows.map((r) => {
            const brand = companies.find((c) => c.slug === r.companyId)?.brandColor;
            return (
              <li
                key={r.url}
                className="relative flex flex-col gap-3 border-t border-hairline py-4 lg:py-5"
              >
                <a
                  href={r.url}
                  className="text-[17px] font-bold leading-[1.35] tracking-[-0.02em] text-balance text-ink underline decoration-transparent underline-offset-4 transition-colors duration-150 after:absolute after:-inset-x-2 after:inset-y-0 after:rounded-panel hover:decoration-accent focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[var(--accent)]"
                >
                  {r.title}
                </a>
                {r.keyValue && (
                  <span className="flex flex-col gap-0.5">
                    <span className="font-mono text-lg font-semibold leading-[1.3] tracking-[-0.02em] break-words text-ink">
                      {r.keyValue}
                    </span>
                    <span className="text-[13px] leading-[1.45] text-muted">{r.keyLabel}</span>
                  </span>
                )}
                <p className="max-w-[65ch] text-[15px] leading-[1.55] text-ink-2">{r.summary}</p>
                <span className="flex items-center gap-2">
                  <Monogram name={r.company} color={brand} size={24} />
                  <span className="text-[13px] leading-[1.45] text-ink-2">{r.company}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
