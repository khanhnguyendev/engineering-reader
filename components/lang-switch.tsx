"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { otherLocale, switchHref, type Locale } from "@/lib/i18n";

export function LangSwitch({
  locale,
  twinMissing,
  switchLabel,
}: {
  locale: Locale;
  twinMissing?: boolean;
  switchLabel: string;
}) {
  const pathname = usePathname();
  const other = otherLocale(locale);
  const href = switchHref(pathname, locale, twinMissing);
  const current = (
    <span className="text-ink" aria-current="true">
      {locale.toUpperCase()}
    </span>
  );
  const link = (
    <Link href={href} hrefLang={other} aria-label={`${switchLabel} (${other.toUpperCase()})`} className="text-muted hover:text-ink">
      {other.toUpperCase()}
    </Link>
  );
  return (
    <span className="mono-label flex items-center gap-2">
      {locale === "vi" ? current : link}
      <span aria-hidden="true" className="text-muted">|</span>
      {locale === "vi" ? link : current}
    </span>
  );
}
