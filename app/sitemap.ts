import type { MetadataRoute } from 'next';
import { listPosts } from '@/lib/content/load';
import { pageEntries } from '@/lib/content/routes';
import { loadVocab } from '@/lib/content/vocab';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const out: MetadataRoute.Sitemap = [];
  for (const entry of pageEntries(listPosts(), loadVocab(), { nonEmptyOnly: true })) {
    if (entry.indexable === false) continue;
    const url = (l: string) => `${SITE_URL}/${l}${entry.path}`;
    const languages: Record<string, string> = Object.fromEntries(entry.locales.map((l) => [l, url(l)]));
    if (entry.locales.includes('vi')) languages['x-default'] = url('vi');
    for (const l of entry.locales) {
      out.push({
        url: url(l),
        ...(entry.lastModified ? { lastModified: entry.lastModified } : {}),
        alternates: { languages: { ...languages } },
      });
    }
  }
  return out;
}
