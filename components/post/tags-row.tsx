import Link from "next/link";
import { CHIP, CHIP_LINK } from "@/components/chip";
import type { Locale } from "@/lib/i18n";

export type TagLink = { slug: string; label: string };

/** Plain chips (company, topic, case type), then one CHIP_LINK per post tag. */
export function TagsRow({
  pills,
  tags = [],
  locale,
}: {
  pills: string[];
  tags?: TagLink[];
  locale?: Locale;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5">
      <ul className="contents">
        {pills.map((p) => (
          <li key={p} className={CHIP}>
            {p}
          </li>
        ))}
        {locale &&
          tags.map((t) => (
            <li key={t.slug} className="contents">
              <Link href={`/${locale}/tags/${t.slug}`} className={CHIP_LINK}>
                {t.label}
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}
