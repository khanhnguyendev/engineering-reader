import type { Locale } from '@/lib/i18n';
import { hasLocale, type PostRecord } from '@/lib/content/load';
import type { Company, Series, Tag, Topic } from '@/lib/content/schema';
import type { Vocab } from '@/lib/content/vocab';

function countBy(posts: readonly PostRecord[], locale: Locale, pick: (p: PostRecord) => string[]) {
  const counts = new Map<string, number>();
  for (const p of posts) {
    if (!hasLocale(p, locale)) continue;
    for (const k of pick(p)) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

export function companiesWithCounts(
  posts: readonly PostRecord[],
  vocab: Vocab,
  locale: Locale,
): Array<{ company: Company; count: number }> {
  const c = countBy(posts, locale, (p) => [p.meta.company]);
  return vocab.companies.map((company) => ({ company, count: c.get(company.slug) ?? 0 }));
}

export function topicsWithCounts(
  posts: readonly PostRecord[],
  vocab: Vocab,
  locale: Locale,
): Array<{ topic: Topic; count: number }> {
  const c = countBy(posts, locale, (p) => [p.meta.topic]);
  return vocab.topics.map((topic) => ({ topic, count: c.get(topic.slug) ?? 0 }));
}

export function tagsWithCounts(
  posts: readonly PostRecord[],
  vocab: Vocab,
  locale: Locale,
): Array<{ tag: Tag; count: number }> {
  const c = countBy(posts, locale, (p) => p.meta.tags);
  return [...vocab.tags]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((tag) => ({ tag, count: c.get(tag.slug) ?? 0 }));
}

export function seriesNav(
  post: PostRecord,
  vocab: Vocab,
  posts: readonly PostRecord[],
  locale: Locale,
): {
  series?: Series & { key: string };
  prev?: PostRecord;
  next?: PostRecord;
  index: number;
  total: number;
} {
  const key = post.meta.series;
  if (key === null || !Object.hasOwn(vocab.series, key)) return { index: -1, total: 0 };
  const series = vocab.series[key];
  if (!series.slugs.includes(post.slug)) return { index: -1, total: 0 };
  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  const ordered = series.slugs
    .map((s) => bySlug.get(s))
    .filter((p): p is PostRecord => p !== undefined && hasLocale(p, locale));
  const index = ordered.findIndex((p) => p.slug === post.slug);
  return {
    series: { key, ...series },
    prev: index > 0 ? ordered[index - 1] : undefined,
    next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : undefined,
    index,
    total: ordered.length,
  };
}

const newestFirst = (a: PostRecord, b: PostRecord) =>
  b.meta.publishedAt.localeCompare(a.meta.publishedAt) || a.slug.localeCompare(b.slug);

export function relatedPosts(
  post: PostRecord,
  posts: readonly PostRecord[],
  locale: Locale,
  n = 3,
): PostRecord[] {
  const cands = posts.filter((p) => p.slug !== post.slug && hasLocale(p, locale));
  const sameTopic = cands.filter((p) => p.meta.topic === post.meta.topic).sort(newestFirst);
  const sameCompany = cands.filter((p) => p.meta.company === post.meta.company).sort(newestFirst);
  const out: PostRecord[] = [];
  for (const p of [...sameTopic, ...sameCompany]) {
    if (!out.includes(p)) out.push(p);
  }
  return out.slice(0, n);
}

export function featuredPosts(
  posts: readonly PostRecord[],
  featured: string[],
  locale: Locale,
  n = 3,
): PostRecord[] {
  const avail = posts.filter((p) => hasLocale(p, locale));
  const out: PostRecord[] = [];
  for (const slug of featured) {
    const p = avail.find((x) => x.slug === slug);
    if (p && !out.includes(p)) out.push(p);
  }
  for (const p of [...avail].sort(newestFirst)) {
    if (!out.includes(p)) out.push(p);
  }
  return out.slice(0, n);
}
