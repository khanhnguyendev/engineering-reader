import Link from "next/link";
import { CHIP_LINK } from "@/components/chip";
import { SectionHeading } from "@/components/section-heading";
import type { Locale } from "@/lib/i18n";

export type TagLink = { slug: string; label: string };

/** The post's own tags as chip links, closing the article before Related. */
export function PostTags({ heading, tags, locale }: { heading: string; tags: TagLink[]; locale: Locale }) {
  if (tags.length === 0) return null;
  return (
    <section className="mt-12">
      <SectionHeading title={heading} />
      <ul className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <li key={t.slug}>
            <Link href={`/${locale}/tags/${t.slug}`} className={CHIP_LINK}>
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
