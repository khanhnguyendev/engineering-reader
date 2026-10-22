import type { Metadata } from 'next';
import { LOCALES, type Locale } from '@/lib/i18n';
import { getDictionary } from '@/lib/dictionaries';
import { SITE_URL } from '@/lib/site';

export function buildMetadata({
  locale,
  path,
  title,
  description,
  type = 'website',
  locales = LOCALES,
  image,
  publishedTime,
  modifiedTime,
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  type?: 'website' | 'article';
  locales?: readonly Locale[];
  /** Path of the OG card; defaults to the locale's site card. */
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
}): Metadata {
  if (path === '/') path = '';
  const languages: Record<string, string> = {};
  for (const l of LOCALES) if (locales.includes(l)) languages[l] = `/${l}${path}`;
  if (locales.includes('vi')) languages['x-default'] = `/vi${path}`;
  const imageUrl = image ?? `/og/${locale}/site.png`;
  const article = type === 'article';
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages,
      types: {
        'application/rss+xml': [{ url: `/${locale}/feed.xml`, title: getDictionary(locale).feed.title }],
      },
    },
    openGraph: {
      locale: locale === 'vi' ? 'vi_VN' : 'en_GB',
      title,
      description,
      url: `/${locale}${path}`,
      type,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      ...(article && publishedTime ? { publishedTime } : {}),
      ...(article && modifiedTime ? { modifiedTime } : {}),
    },
    twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
  };
}
