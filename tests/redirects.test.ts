import { afterAll, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readRedirects, RedirectsSchema, staticRoutes, toNextRedirects } from '@/lib/content/redirects';
import { validateAll } from '@/lib/content/validate';
import type { Vocab } from '@/lib/content/vocab';

const tmp = mkdtempSync(path.join(tmpdir(), 'redirects-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

const vocab: Vocab = {
  companies: [
    { slug: 'discord', name: 'Discord', blogUrl: 'https://discord.com/blog', feedUrl: 'https://discord.com/blog/rss.xml', brandColor: '#5865F2', logo: 'public/logos/discord.svg' },
  ],
  topics: [{ slug: 'data', vi: 'Dữ liệu', en: 'Data' }],
  tags: [{ slug: 'kafka', vi: 'Kafka', en: 'Kafka' }],
  series: { s1: { vi: 'Một', en: 'One', slugs: [] } } as unknown as Vocab['series'],
  sourceHosts: [],
  featured: [],
};
const posts = [
  { slug: 'both', locales: { vi: {}, en: {} } },
  { slug: 'vi-only', locales: { vi: {} } },
];

/** A temp site: <site>/posts is the content root, <site>/redirects.json beside it. */
function site(json: unknown) {
  const dir = mkdtempSync(path.join(tmp, 's-'));
  mkdirSync(path.join(dir, 'posts'));
  writeFileSync(path.join(dir, 'redirects.json'), JSON.stringify(json));
  return dir;
}

describe('redirects schema', () => {
  it('defaults permanent to true', () => {
    expect(RedirectsSchema.parse([{ from: '/a', to: '/b' }])).toEqual([{ from: '/a', to: '/b', permanent: true }]);
  });
  it('rejects a from or to that is not a path', () => {
    expect(RedirectsSchema.safeParse([{ from: 'a', to: '/b' }]).success).toBe(false);
    expect(RedirectsSchema.safeParse([{ from: '/a', to: 'https://x.dev' }]).success).toBe(false);
  });
});

describe('readRedirects', () => {
  it('reads and parses a file', () => {
    const dir = site([{ from: '/old', to: '/vi', permanent: false }]);
    expect(readRedirects(path.join(dir, 'redirects.json'))).toEqual([{ from: '/old', to: '/vi', permanent: false }]);
  });
  it('reads the committed content/redirects.json by default', () => {
    expect(readRedirects()).toEqual([]);
  });
});

describe('staticRoutes', () => {
  const routes = staticRoutes(posts, vocab);
  it('has the home pages and every listing, both locales', () => {
    for (const l of ['vi', 'en']) {
      for (const p of ['', '/companies', '/companies/discord', '/topics', '/topics/data', '/tags', '/tags/kafka', '/series/s1', '/about', '/posts/both']) {
        expect(routes.has(`/${l}${p}`), `/${l}${p}`).toBe(true);
      }
    }
    expect(routes.has('/')).toBe(true);
  });
  it('lists a post only in the locales it has', () => {
    expect(routes.has('/vi/posts/vi-only')).toBe(true);
    expect(routes.has('/en/posts/vi-only')).toBe(false);
  });
});

describe('toNextRedirects', () => {
  it('maps to Next source/destination/permanent', () => {
    expect(toNextRedirects([{ from: '/a', to: '/b', permanent: false }])).toEqual([
      { source: '/a', destination: '/b', permanent: false },
    ]);
  });
});

describe('validator rule redirects', () => {
  const run = (json: unknown) => validateAll(path.join(site(json), 'posts'), vocab, { today: '2026-10-22' }).findings.filter((f) => f.rule === 'redirects');
  it('accepts an empty list and a free path', () => {
    expect(run([])).toEqual([]);
    expect(run([{ from: '/old-post', to: '/vi' }])).toEqual([]);
  });
  it('rejects a from that is a static route', () => {
    const f = run([{ from: '/vi/companies/discord', to: '/vi' }]);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ level: 'error', rule: 'redirects', file: 'redirects.json' });
  });
  it('rejects a to that is not an internal path', () => {
    expect(run([{ from: '/x', to: 'https://evil.dev' }])).toHaveLength(1);
    expect(run([{ from: '/x', to: '//evil.dev' }])).toHaveLength(1);
  });
});
