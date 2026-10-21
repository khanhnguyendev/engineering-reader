export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export function isLocale(x: string): x is Locale {
  return (LOCALES as readonly string[]).includes(x);
}

export function otherLocale(l: Locale): Locale {
  return l === 'vi' ? 'en' : 'vi';
}

export function fmt(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (m, k: string) =>
    k in vars ? String(vars[k]) : m,
  );
}

/** The same page in the other locale, or that locale's home when the twin is missing. */
export function switchHref(pathname: string, locale: Locale, twinMissing?: boolean): string {
  const other = otherLocale(locale);
  if (twinMissing) return `/${other}`;
  const rest = pathname.split('/').slice(2).filter(Boolean);
  return ['', other, ...rest].join('/');
}
