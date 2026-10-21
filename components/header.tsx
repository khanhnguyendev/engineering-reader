import Link from "next/link";
import { LangSwitch } from "@/components/lang-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { getDictionary, type Locale } from "@/lib/i18n";

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
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href={`/${locale}`} className="font-semibold text-ink">
          {dict.site.name}
        </Link>
        <nav aria-label={dict.site.name} className="flex items-center gap-6">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="mono-label text-muted hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <LangSwitch locale={locale} twinMissing={twinMissing} switchLabel={dict.lang.switch} />
          <ThemeToggle ariaLabel={dict.theme.light} />
        </div>
      </div>
    </header>
  );
}
