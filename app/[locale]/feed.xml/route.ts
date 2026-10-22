import { LOCALES, isLocale } from '@/lib/i18n';
import { CONTENT_ROOT, listPosts } from '@/lib/content/load';
import { loadVocab } from '@/lib/content/vocab';
import { getDictionary } from '@/lib/dictionaries';
import { buildFeed } from '@/lib/feed';
import { SITE_URL } from '@/lib/site';

export const dynamicParams = false;
export const dynamic = 'force-static';

type Params = Promise<{ locale: string }>;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function GET(_req: Request, { params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response('Not found', { status: 404 });
  const xml = buildFeed(locale, listPosts(CONTENT_ROOT), loadVocab(), getDictionary(locale), SITE_URL);
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
