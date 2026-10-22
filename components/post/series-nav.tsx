import Link from "next/link";
import type { PostRecord } from "@/lib/content/load";
import type { Dictionary } from "@/lib/dictionaries";
import { fmt, type Locale } from "@/lib/i18n";

/** Where this post sits in its series, with the way to the neighbours. Renders only for a listed post. */
export function SeriesNav({
  locale,
  dict,
  seriesKey,
  title,
  index,
  total,
  prev,
  next,
}: {
  locale: Locale;
  dict: Dictionary;
  seriesKey: string;
  title: string;
  index: number;
  total: number;
  prev?: PostRecord;
  next?: PostRecord;
}) {
  const label = (p: PostRecord) => p.locales[locale]?.frontmatter.title ?? p.slug;
  return (
    <nav aria-label={`${dict.series.title}: ${title}`} className="panel mt-8 p-4 lg:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-[15px] font-semibold leading-[1.45] text-ink">
          {title} <span className="font-mono text-[13px] font-normal text-muted">{fmt(dict.series.part, { i: index + 1, n: total })}</span>
        </p>
        <Link
          href={`/${locale}/series/${seriesKey}`}
          className="mono-label text-muted underline decoration-hairline-strong underline-offset-4 transition-colors duration-150 hover:text-ink hover:decoration-accent"
        >
          {dict.series.index}
        </Link>
      </div>
      {(prev || next) && (
        <div className="mt-4 grid gap-3 border-t border-hairline pt-4 sm:grid-cols-2">
          {prev ? (
            <Link rel="prev" href={`/${locale}/posts/${prev.slug}`} className="group flex flex-col gap-0.5">
              <span className="mono-label text-muted">{dict.series.prev}</span>
              <span className="text-[15px] leading-[1.4] text-ink underline decoration-transparent underline-offset-4 transition-colors duration-150 group-hover:decoration-accent">
                {label(prev)}
              </span>
            </Link>
          ) : (
            <span aria-hidden="true" className="hidden sm:block" />
          )}
          {next && (
            <Link
              rel="next"
              href={`/${locale}/posts/${next.slug}`}
              className="group flex flex-col gap-0.5 sm:items-end sm:text-right"
            >
              <span className="mono-label text-muted">{dict.series.next}</span>
              <span className="text-[15px] leading-[1.4] text-ink underline decoration-transparent underline-offset-4 transition-colors duration-150 group-hover:decoration-accent">
                {label(next)}
              </span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
