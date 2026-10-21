import type { Metadata } from 'next';
import type { Locale } from '@/lib/i18n';
import { SITE_URL } from '@/lib/site';

export function buildMetadata({
  locale,
  path,
  title,
  description,
  type = 'website',
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  type?: 'website' | 'article';
}): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { vi: `/vi${path}`, en: `/en${path}`, 'x-default': `/vi${path}` },
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
