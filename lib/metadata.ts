import type { Metadata } from 'next';
import { LOCALES, type Locale } from '@/lib/i18n';
import { SITE_URL } from '@/lib/site';

export function buildMetadata({
  locale,
  path,
  title,
  description,
  type = 'website',
  locales = LOCALES,
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  type?: 'website' | 'article';
  locales?: readonly Locale[];
}): Metadata {
  if (path === '/') path = '';
  const languages: Record<string, string> = {};
  for (const l of LOCALES) if (locales.includes(l)) languages[l] = `/${l}${path}`;
  if (locales.includes('vi')) languages['x-default'] = `/vi${path}`;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages,
    },
    openGraph: {
      locale: locale === 'vi' ? 'vi_VN' : 'en_GB',
      title,
      description,
      url: `/${locale}${path}`,
      type,
    },
  };
}
