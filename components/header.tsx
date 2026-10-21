import Link from "next/link";
import { LangSwitch } from "@/components/lang-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

export function Header({
  locale,
  twinMissing,
}: {
  locale: Locale;
  twinMissing?: boolean;
}) {
  const dict = getDictionary(locale);
  const nav = [
    { href: `/${locale}/companies`, label: dict.nav.companies },
    { href: `/${locale}/topics`, label: dict.nav.topics },
    { href: `/${locale}/about`, label: dict.nav.about },
  ];
  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-4 gap-y-2.5 px-4 py-3 sm:flex-nowrap sm:px-6 sm:py-4">
        <Link href={`/${locale}`} className="font-semibold text-ink">
          {dict.site.name}
        </Link>
        <nav aria-label={dict.nav.label} className="order-last flex w-full items-center gap-5 sm:order-none sm:w-auto sm:gap-6">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="mono-label text-muted hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <LangSwitch locale={locale} twinMissing={twinMissing} switchLabel={dict.lang.switch} />
          <ThemeToggle
            groupLabel={dict.theme.toggle}
            lightLabel={dict.theme.light}
            darkLabel={dict.theme.dark}
            lightShort={dict.theme.lightShort}
            darkShort={dict.theme.darkShort}
          />
        </div>
      </div>
    </header>
  );
}
