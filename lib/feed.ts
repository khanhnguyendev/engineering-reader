import type { PostRecord } from './content/load';
import type { Vocab } from './content/vocab';
import type { Locale } from './i18n';
import { escapeXml as x } from './xml';

export const FEED_LIMIT = 20;

/** The dictionary strings a feed needs; a structural subset of the full dictionary. */
export type FeedDict = {
  feed: { title: string; description: string; readMore: string };
  post: { tldr: string; smallTeam: string };
};

const rfc822 = (day: string) => new Date(`${day}T00:00:00Z`).toUTCString();
const list = (items: string[]) => `<ul>${items.map((i) => `<li>${x(i)}</li>`).join('')}</ul>`;

/** RSS 2.0 for one locale: the newest posts, each as its top layer plus a link, never the deep layer. */
export function buildFeed(
  locale: Locale,
  posts: readonly PostRecord[],
  vocab: Vocab,
  dict: FeedDict,
  siteUrl: string,
): string {
  const mine = posts
    .filter((p) => p.locales[locale] !== undefined)
    .sort((a, b) => b.meta.publishedAt.localeCompare(a.meta.publishedAt) || a.slug.localeCompare(b.slug))
    .slice(0, FEED_LIMIT);

  const items = mine.map((p) => {
    const fm = p.locales[locale]!.frontmatter;
    const url = `${siteUrl}/${locale}/posts/${p.slug}`;
    const topic = vocab.topics.find((t) => t.slug === p.meta.topic);
    const nums = p.meta.keyNumbers.map((k) => `${k.value} ${fm.keyNumberLabels[k.id] ?? ''}`.trim());
    const html = [
      `<p>${x(fm.summary)}</p>`,
      list(nums),
      `<p><strong>${x(dict.post.tldr)}</strong></p>`,
      list(fm.tldr),
      `<p><strong>${x(dict.post.smallTeam)}</strong></p>`,
      list(fm.smallTeam),
      `<p><a href="${x(url)}">${x(dict.feed.readMore)}</a></p>`,
    ].join('');
    return [
      '<item>',
      `<title>${x(fm.title)}</title>`,
      `<link>${x(url)}</link>`,
      `<guid isPermaLink="true">${x(url)}</guid>`,
      `<pubDate>${rfc822(p.meta.publishedAt)}</pubDate>`,
      `<category>${x(topic?.[locale] ?? p.meta.topic)}</category>`,
      `<description>${x(html)}</description>`,
      '</item>',
    ].join('');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>',
    `<title>${x(dict.feed.title)}</title>`,
    `<link>${x(`${siteUrl}/${locale}`)}</link>`,
    `<description>${x(dict.feed.description)}</description>`,
    `<language>${locale}</language>`,
    `<atom:link href="${x(`${siteUrl}/${locale}/feed.xml`)}" rel="self" type="application/rss+xml"/>`,
    ...(mine.length > 0 ? [`<lastBuildDate>${rfc822(mine[0].meta.publishedAt)}</lastBuildDate>`] : []),
    ...items,
    '</channel></rss>',
    '',
  ].join('\n');
}
