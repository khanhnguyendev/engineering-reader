import { Avatar } from "@/components/post/avatar";
import { fmt, type Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionaries";

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export function PostMeta({
  locale,
  dict,
  publishedAt,
  minutes,
}: {
  locale: Locale;
  dict: Dictionary;
  publishedAt: string;
  minutes: number;
}) {
  return (
    <p className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
      <Avatar />
      <span className="font-semibold text-ink">{dict.post.byline}</span>
      <span aria-hidden="true">·</span>
      <time dateTime={publishedAt} className="font-mono text-[12px]">
        {formatDate(publishedAt, locale)}
      </time>
      <span aria-hidden="true">·</span>
      <span className="font-mono text-[12px]">{fmt(dict.post.readMinutes, { n: minutes })}</span>
    </p>
  );
}
