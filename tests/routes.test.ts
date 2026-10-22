import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { LOCALES } from '@/lib/i18n';
import { listPosts } from '@/lib/content/load';
import { endpointRoutes, localesFor, pageEntries } from '@/lib/content/routes';
import type { Vocab } from '@/lib/content/vocab';

const vocab: Vocab = {
  companies: [
    { slug: 'discord', name: 'Discord', blogUrl: 'https://discord.com/blog', feedUrl: 'https://discord.com/blog/rss.xml', brandColor: '#5865F2', logo: 'public/logos/discord.svg' },
    { slug: 'empty-co', name: 'Empty', blogUrl: 'https://e.dev/blog', feedUrl: 'https://e.dev/rss.xml', brandColor: '#000000', logo: 'public/logos/e.svg' },
  ],
  topics: [{ slug: 'data', vi: 'Dữ liệu', en: 'Data' }],
  tags: [
    { slug: 'kafka', vi: 'Kafka', en: 'Kafka' },
    { slug: 'unused', vi: 'Unused', en: 'Unused' },
  ],
  series: { s1: { vi: 'Một', en: 'One', slugs: [] } } as unknown as Vocab['series'],
  sourceHosts: [],
  featured: [],
};
const meta = (over: Record<string, unknown> = {}) => ({
  company: 'discord',
  topic: 'data',
  tags: ['kafka'],
  series: null as string | null,
  publishedAt: '2026-10-01',
  updatedAt: null as string | null,
  ...over,
});
const posts = [
  { slug: 'both', locales: { vi: {}, en: {} }, meta: meta({ updatedAt: '2026-10-05' }) },
  { slug: 'vi-only', locales: { vi: {} }, meta: meta({ series: 's1' }) },
];
const find = (list: ReturnType<typeof pageEntries>, p: string) => list.find((e) => e.path === p);

describe('pageEntries', () => {
  const all = pageEntries(posts, vocab);
  it('has home in both locales', () => {
    expect(find(all, '')?.locales).toEqual(['vi', 'en']);
  });
  it('gives a vi-only post only vi, with lastModified', () => {
    expect(find(all, '/posts/vi-only')).toMatchObject({ locales: ['vi'], lastModified: '2026-10-01' });
    expect(find(all, '/posts/both')).toMatchObject({ locales: ['vi', 'en'], lastModified: '2026-10-05' });
  });
  it('covers indexes and every vocab page by default', () => {
    for (const p of ['/about', '/companies', '/topics', '/tags', '/companies/empty-co', '/tags/unused', '/series/s1']) {
      expect(find(all, p), p).toBeDefined();
    }
  });
  it('runs over the real fixture posts with home in both locales', () => {
    const real = listPosts(path.join(__dirname, 'fixtures', 'posts'));
    expect(real.length).toBeGreaterThan(0);
    const entries = pageEntries(real, vocab);
    expect(find(entries, '')).toMatchObject({ path: '', locales: ['vi', 'en'] });
    for (const p of real) {
      expect(find(entries, `/posts/${p.slug}`)).toMatchObject({
        locales: LOCALES.filter((l) => p.locales[l]),
        lastModified: p.meta.updatedAt ?? p.meta.publishedAt,
      });
    }
  });
  it('nonEmptyOnly drops unused pages and trims locales', () => {
    const ne = pageEntries(posts, vocab, { nonEmptyOnly: true });
    expect(find(ne, '/tags/unused')).toBeUndefined();
    expect(find(ne, '/companies/empty-co')).toBeUndefined();
    expect(find(ne, '/tags/kafka')?.locales).toEqual(['vi', 'en']);
    expect(find(ne, '/series/s1')?.locales).toEqual(['vi']);
    const viOnly = pageEntries([posts[1]], vocab, { nonEmptyOnly: true });
    expect(find(viOnly, '/companies/discord')?.locales).toEqual(['vi']);
  });
});

describe('endpointRoutes', () => {
  const r = endpointRoutes(posts);
  it('lists per-locale endpoints only for locales a post has', () => {
    expect(r).toContain('/vi/posts/vi-only.md');
    expect(r).not.toContain('/en/posts/vi-only.md');
    expect(r).toContain('/og/en/both.png');
    expect(r).not.toContain('/og/en/vi-only.png');
    expect(r).toContain('/og/vi/site.png');
    expect(r).toContain('/en/feed.xml');
  });
  it('includes the root endpoints', () => {
    for (const p of ['/llms.txt', '/sitemap.xml', '/robots.txt', '/feed.xml']) expect(r).toContain(p);
  });
});

describe('localesFor', () => {
  it('returns only the locales with posts for that path', () => {
    expect(localesFor('/tags/kafka', posts, vocab)).toEqual(['vi', 'en']);
    expect(localesFor('/series/s1', posts, vocab)).toEqual(['vi']);
  });
  it('is [] for a path with no posts in any locale', () => {
    expect(localesFor('/tags/unused', posts, vocab)).toEqual([]);
  });
});
