import type { PostRecord } from './content/load';
import type { Vocab } from './content/vocab';
import type { Locale } from './i18n';

const HEADLINE_MAX = 110;

// Cut on code points so a surrogate pair is never split.
const clip = (s: string) => {
  const cps = Array.from(s);
  return cps.length > HEADLINE_MAX ? `${cps.slice(0, HEADLINE_MAX - 1).join('').trimEnd()}…` : s;
};

/** schema.org Article for one post in one locale; every URL is absolute from `siteUrl`. */
export function articleJsonLd(
  post: PostRecord,
  locale: Locale,
  vocab: Vocab,
  dict: { site: { name: string } },
  siteUrl: string,
): Record<string, unknown> {
  const { meta } = post;
  const fm = post.locales[locale]!.frontmatter;
  const company = vocab.companies.find((c) => c.slug === meta.company);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: clip(fm.title),
    description: fm.summary,
    inLanguage: locale,
    datePublished: meta.publishedAt,
    dateModified: meta.updatedAt ?? meta.publishedAt,
    mainEntityOfPage: `${siteUrl}/${locale}/posts/${post.slug}`,
    image: [`${siteUrl}/og/${locale}/${post.slug}.png`],
    author: { '@type': 'Person', name: 'Ryan', url: `${siteUrl}/${locale}/about` },
    publisher: { '@type': 'Organization', name: dict.site.name, url: siteUrl },
    about: company?.name ?? meta.company,
    keywords: meta.tags.map((slug) => vocab.tags.find((t) => t.slug === slug)?.[locale] ?? slug),
    citation: meta.sources.map((s) => ({
      '@type': 'CreativeWork',
      name: s.title,
      url: s.url,
      author: s.authors.map((name) => ({ '@type': 'Person', name })),
      datePublished: s.publishedAt,
    })),
  };
}
