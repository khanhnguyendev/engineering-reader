import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { listPosts, type PostRecord } from '@/lib/content/load';
import type { Vocab } from '@/lib/content/vocab';
import { RedirectsSchema } from '@/lib/content/schema';
import {
  companiesWithCounts,
  topicsWithCounts,
  tagsWithCounts,
  seriesNav,
  relatedPosts,
  featuredPosts,
} from '@/lib/content/index';

const FIXTURES = path.resolve(import.meta.dirname, '../fixtures/posts');
const base = listPosts(FIXTURES).find((p) => p.slug === 'good-post')!;

function mk(
  slug: string,
  over: { company?: string; topic?: PostRecord['meta']['topic']; publishedAt?: string; series?: string | null; locales?: ('vi' | 'en')[] } = {},
): PostRecord {
  const locales: PostRecord['locales'] = {};
  for (const l of over.locales ?? ['vi', 'en']) locales[l] = base.locales[l];
  return {
    ...base,
    slug,
    meta: {
      ...base.meta,
      slug,
      company: over.company ?? base.meta.company,
      topic: over.topic ?? base.meta.topic,
      publishedAt: over.publishedAt ?? base.meta.publishedAt,
      series: over.series === undefined ? null : over.series,
    },
    locales,
  };
}

const entry = (slug: string) => ({ slug, vi: slug, en: slug });
const company = (slug: string) => ({
  slug, name: slug, blogUrl: 'https://example.com', feedUrl: null, brandColor: '#000000', logo: 'x',
});
const vocab: Vocab = {
  companies: ['discord', 'cloudflare', 'netflix'].map(company),
  topics: ['distributed-systems', 'data', 'infra'].map(entry),
  tags: ['rust', 'cassandra', 'alpha'].map(entry),
  series: { s: { slugs: ['a', 'b', 'c'], vi: 'Chuỗi', en: 'Series' } },
  sourceHosts: [],
};

describe('counts', () => {
  const posts = [mk('a'), mk('b', { locales: ['vi'] }), mk('c', { company: 'netflix' })];
  it('counts companies in vocab order, per locale', () => {
    const vi = companiesWithCounts(posts, vocab, 'vi');
    expect(vi.map((x) => x.company.slug)).toEqual(vocab.companies.map((c) => c.slug));
    expect(vi.find((x) => x.company.slug === 'discord')?.count).toBe(2);
    expect(vi.find((x) => x.company.slug === 'netflix')?.count).toBe(1);
    expect(companiesWithCounts(posts, vocab, 'en').find((x) => x.company.slug === 'discord')?.count).toBe(1);
  });
  it('counts topics', () => {
    const r = topicsWithCounts(posts, vocab, 'en');
    expect(r.map((x) => x.topic.slug)).toEqual(vocab.topics.map((t) => t.slug));
    expect(r.find((x) => x.topic.slug === 'data')?.count).toBe(2);
  });
  it('returns all tags sorted by slug, with zero counts', () => {
    const r = tagsWithCounts(posts, vocab, 'vi');
    expect(r.length).toBe(vocab.tags.length);
    const slugs = r.map((x) => x.tag.slug);
    expect(slugs).toEqual([...slugs].sort());
    expect(r.find((x) => x.tag.slug === 'cassandra')?.count).toBe(3);
    expect(tagsWithCounts([], vocab, 'vi').every((x) => x.count === 0)).toBe(true);
  });
});

describe('seriesNav', () => {
  it('returns index -1 when no series or unknown key', () => {
    expect(seriesNav(mk('a'), vocab, [mk('a')], 'vi')).toEqual({ index: -1, total: 0 });
    const p = mk('a', { series: 'nope' });
    expect(seriesNav(p, vocab, [p], 'vi')).toEqual({ index: -1, total: 0 });
  });
  it('returns index -1 when the post is not in series.slugs', () => {
    const x = mk('x', { series: 's' });
    expect(seriesNav(x, vocab, [x, mk('a', { series: 's' })], 'vi')).toEqual({ index: -1, total: 0 });
  });
  it('single post series', () => {
    const a = mk('a', { series: 's' });
    const r = seriesNav(a, vocab, [a], 'vi');
    expect(r.index).toBe(0);
    expect(r.total).toBe(1);
    expect(r.prev).toBeUndefined();
    expect(r.next).toBeUndefined();
    expect(r.series?.key).toBe('s');
    expect(r.series?.slugs).toEqual(['a', 'b', 'c']);
  });
  it('three posts, middle has prev and next; missing slugs skipped', () => {
    const [a, b, c] = ['a', 'b', 'c'].map((s) => mk(s, { series: 's' }));
    const r = seriesNav(b, vocab, [c, a, b], 'en');
    expect(r.index).toBe(1);
    expect(r.total).toBe(3);
    expect(r.prev?.slug).toBe('a');
    expect(r.next?.slug).toBe('c');
    const r2 = seriesNav(c, vocab, [a, c], 'en');
    expect(r2.prev?.slug).toBe('a');
    expect(r2.total).toBe(2);
  });
  it('skips posts lacking the locale', () => {
    const a = mk('a', { series: 's', locales: ['vi'] });
    const b = mk('b', { series: 's' });
    const c = mk('c', { series: 's' });
    expect(seriesNav(b, vocab, [a, b, c], 'en').prev).toBeUndefined();
    expect(seriesNav(b, vocab, [a, b, c], 'vi').prev?.slug).toBe('a');
  });
});

describe('relatedPosts', () => {
  const self = mk('self', { publishedAt: '2026-01-01' });
  const sameTopicOld = mk('t-old', { publishedAt: '2026-02-01' });
  const sameTopicNew = mk('t-new', { publishedAt: '2026-03-01' });
  const sameCompany = mk('c1', { topic: 'infra', publishedAt: '2026-04-01' });
  const other = mk('o', { topic: 'infra', company: 'netflix' });
  const viOnly = mk('vi-only', { locales: ['vi'], publishedAt: '2026-05-01' });
  const all = [self, sameTopicOld, sameTopicNew, sameCompany, other, viOnly];
  it('topic newest first, then company, excludes self and other locales', () => {
    expect(relatedPosts(self, all, 'en').map((p) => p.slug)).toEqual(['t-new', 't-old', 'c1']);
    expect(relatedPosts(self, all, 'vi').map((p) => p.slug)).toEqual(['vi-only', 't-new', 't-old']);
  });
  it('respects n and dedupes', () => {
    expect(relatedPosts(self, all, 'en', 1).map((p) => p.slug)).toEqual(['t-new']);
    const r = relatedPosts(self, all, 'en', 10).map((p) => p.slug);
    expect(new Set(r).size).toBe(r.length);
  });
});

describe('featuredPosts', () => {
  const a = mk('a', { publishedAt: '2026-01-01' });
  const b = mk('b', { publishedAt: '2026-02-01' });
  const c = mk('c', { publishedAt: '2026-03-01' });
  const d = mk('d', { publishedAt: '2026-04-01', locales: ['vi'] });
  it('uses featured order, ignoring missing slugs, then fills newest', () => {
    expect(featuredPosts([a, b, c, d], ['a', 'zzz'], 'en', 3).map((p) => p.slug)).toEqual(['a', 'c', 'b']);
  });
  it('dedupes a duplicated featured slug', () => {
    expect(featuredPosts([a, b, c], ['a', 'a'], 'en', 3).map((p) => p.slug)).toEqual(['a', 'c', 'b']);
  });
  it('falls back to newest when none featured; honors locale', () => {
    expect(featuredPosts([a, b, c, d], [], 'vi', 2).map((p) => p.slug)).toEqual(['d', 'c']);
    expect(featuredPosts([a, b, c, d], ['d'], 'en', 3).map((p) => p.slug)).toEqual(['c', 'b', 'a']);
  });
});

describe('RedirectsSchema', () => {
  it('defaults permanent to true', () => {
    expect(RedirectsSchema.parse([{ from: '/a', to: '/b' }])).toEqual([{ from: '/a', to: '/b', permanent: true }]);
  });
  it('rejects paths without a leading slash', () => {
    expect(RedirectsSchema.safeParse([{ from: 'a', to: '/b' }]).success).toBe(false);
  });
});
