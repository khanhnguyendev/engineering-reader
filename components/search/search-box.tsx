"use client";

import { useEffect, useId, useRef, useState } from "react";
import { loadPagefind } from "@/components/search/load-pagefind";
import type { Dictionary } from "@/lib/dictionaries";
import { toSitePath } from "@/lib/fold";
import { plural, type Locale } from "@/lib/i18n";

type State = "idle" | "loading" | "results" | "empty" | "unavailable" | "error";
type Row = { url: string; title: string; summary: string; company: string };

const DEBOUNCE_MS = 200;
const MAX_ROWS = 10;
const MIN_CHARS = 2;

/** Search over the static Pagefind index. Rows come from result metadata, never from excerpts. */
export function SearchBox({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.search;
  const id = useId();
  const [q, setQ] = useState("");
  const [state, setState] = useState<State>("idle");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const run = useRef(0);

  // The ?q= value seeds the box once, after hydration.
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("q");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the URL is only possible after mount
    if (initial) setQ(initial);
  }, []);

  useEffect(() => {
    const term = q.trim();
    const mine = ++run.current;
    if (term.length < MIN_CHARS) return;
    const timer = setTimeout(async () => {
      setState("loading");
      try {
        const pf = await loadPagefind();
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
          })),
        );
        setState(found.results.length === 0 ? "empty" : "results");
      } catch {
        if (run.current === mine) setState("error");
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q]);

  function onChange(value: string) {
    setQ(value);
    const term = value.trim();
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
        className="w-full rounded-panel border border-hairline-strong bg-panel px-4 py-3 text-[17px] leading-[1.4] text-ink placeholder:text-muted"
      />
      <p aria-live="polite" className="mono-label mt-4 min-h-[1.5em] text-muted">
        {message[view]}
      </p>
      {(view === "results" || (view === "loading" && rows.length > 0)) && (
        <ol data-search-results className="mt-2 border-b border-hairline">
          {rows.map((r) => (
            <li
              key={r.url}
              className="relative flex flex-col gap-1.5 border-t border-hairline py-4 transition-colors duration-150 hover:bg-panel-2 lg:py-5"
            >
              <a
                href={r.url}
                className="text-[17px] leading-[1.35] text-ink underline decoration-transparent underline-offset-4 transition-colors duration-150 after:absolute after:inset-0 hover:decoration-accent lg:text-[19px]"
              >
                {r.title}
              </a>
              <p className="max-w-[65ch] text-[15px] leading-[1.55] text-ink-2">{r.summary}</p>
              <p className="mono-label text-muted">{r.company}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
