import Link from "next/link";
import { NavLink } from "@/components/nav-link";
import { LangSwitch } from "@/components/lang-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

export function Header({
  locale,
  twinMissing,
  pathless,
}: {
  locale: Locale;
  twinMissing?: boolean;
  /** True where the server cannot know the URL (the root 404): no nav item is current until the browser path is read. */
  pathless?: boolean;
}) {
  const dict = getDictionary(locale);
  const nav = [
    { section: "companies", label: dict.nav.companies },
    { section: "topics", label: dict.nav.topics },
    { section: "about", label: dict.nav.about },
    { section: "search", label: dict.nav.search },
  ];
  return (
    <header className="border-b border-hairline">
      <a
        href="#content"
        className="sr-only rounded-panel bg-accent px-3 py-2 text-[14px] font-semibold text-accent-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60]"
      >
        {dict.nav.skip}
      </a>
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-4 gap-y-2.5 px-4 py-3 sm:flex-nowrap sm:px-6 sm:py-4">
        <Link href={`/${locale}`} className="font-semibold text-ink">
          {dict.site.name}
        </Link>
        <nav aria-label={dict.nav.label} className="order-last flex w-full items-center gap-5 sm:order-none sm:w-auto sm:gap-6">
          {nav.map((n) => (
            <NavLink key={n.section} href={`/${locale}/${n.section}`} locale={locale} section={n.section} serverPath={pathless ? "" : undefined}>
              {n.label}
            </NavLink>
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
