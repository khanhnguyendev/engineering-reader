import Link from "next/link";
import { CHIP } from "@/components/chip";
import { Monogram } from "@/components/monogram";
import type { PostRecord } from "@/lib/content/load";
import type { Company } from "@/lib/content/schema";
import type { Dictionary } from "@/lib/dictionaries";
import { fmt, type Locale } from "@/lib/i18n";

/** One case in a list: the whole panel is the link. Renders nothing if the post lacks `locale`. */
export function PostCard({
  post,
  locale,
  company,
  topicLabel,
  dict,
}: {
  post: PostRecord;
  locale: Locale;
  company?: Company;
  topicLabel: string;
  dict: Dictionary;
}) {
  const doc = post.locales[locale];
  if (!doc) return null;
  const fm = doc.frontmatter;
  const first = post.meta.keyNumbers[0];
  const name = company?.name ?? post.meta.company;
  return (
    <li className="flex">
      <Link
        href={`/${locale}/posts/${post.slug}`}
        className="panel flex w-full flex-col gap-3 p-4 transition-colors duration-150 hover:border-hairline-strong hover:bg-panel-2 lg:p-6"
      >
        <h3 className="text-[17px] font-bold leading-[1.35] tracking-[-0.02em] text-balance text-ink">
          {fm.title}
        </h3>
        {first && (
          <span className="flex flex-col gap-0.5">
            <span className="font-mono text-lg font-semibold leading-[1.3] tracking-[-0.02em] break-words text-ink">
              {first.value}
            </span>
            <span className="text-[13px] leading-[1.45] text-muted">
              {fm.keyNumberLabels[first.id] ?? first.id}
            </span>
          </span>
        )}
        <span className="mt-auto flex items-center justify-between gap-3 pt-1">
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
            <Monogram name={name} color={company?.brandColor} size={24} />
            <span className="text-[13px] leading-[1.45] text-ink-2">{name}</span>
            <span aria-hidden="true" className="text-[13px] text-muted">·</span>
            <span className={CHIP}>{topicLabel}</span>
          </span>
          <span className="shrink-0 font-mono text-xs text-muted">
            {fmt(dict.post.readMinutes, { n: doc.readingTime.whole })}
          </span>
        </span>
      </Link>
    </li>
  );
}
