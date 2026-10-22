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
const m = { company: 'discord', topic: 'data', tags: [], series: null, publishedAt: '2026-10-01', updatedAt: null };
const posts = [
  { slug: 'both', locales: { vi: {}, en: {} }, meta: m },
  { slug: 'vi-only', locales: { vi: {} }, meta: m },
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
  it('rejects a from that is a pattern', () => {
    for (const from of ['/a/:slug', '/a/*', '/a?x', '/(a)', '/a+', '/a b', '/a{b}']) {
      expect(RedirectsSchema.safeParse([{ from, to: '/b' }]).success, from).toBe(false);
    }
  });
  it('rejects a trailing slash on from, except the root', () => {
    expect(RedirectsSchema.safeParse([{ from: '/old/', to: '/b' }]).success).toBe(false);
    expect(RedirectsSchema.safeParse([{ from: '/', to: '/b' }]).success).toBe(true);
  });
});

describe('redirects schema, to', () => {
  it('rejects control characters, double slashes, backslashes and spaces', () => {
    for (const to of ['/\t/evil.dev', '/\n/evil.dev', '//evil.dev', '/\\evil.dev', '/a b']) {
      expect(RedirectsSchema.safeParse([{ from: '/x', to }]).success, JSON.stringify(to)).toBe(false);
    }
  });
  it('accepts an internal path with query and hash', () => {
    expect(RedirectsSchema.safeParse([{ from: '/x', to: '/vi/tags/kafka?a=1#h' }]).success).toBe(true);
  });
});

describe('readRedirects', () => {
  it('reads and parses a file', () => {
    const dir = site([{ from: '/old', to: '/vi', permanent: false }]);
    expect(readRedirects(path.join(dir, 'redirects.json'))).toEqual([{ from: '/old', to: '/vi', permanent: false }]);
  });
  it('reads the committed content/redirects.json by default', () => {
    expect(readRedirects()).toEqual([{ from: '/feed.xml', to: '/vi/feed.xml', statusCode: 301 }]);
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

describe('statusCode redirects', () => {
  it('maps statusCode instead of permanent, never both', () => {
    const [out] = toNextRedirects(RedirectsSchema.parse([{ from: '/feed.xml', to: '/vi/feed.xml', statusCode: 301 }]));
    expect(out).toEqual({ source: '/feed.xml', destination: '/vi/feed.xml', statusCode: 301 });
    expect('permanent' in out).toBe(false);
    const [old] = toNextRedirects(RedirectsSchema.parse([{ from: '/a', to: '/b' }]));
    expect(old).toEqual({ source: '/a', destination: '/b', permanent: true });
  });
  it('rejects an entry with both permanent and statusCode', () => {
    const r = RedirectsSchema.safeParse([{ from: '/a', to: '/b', permanent: true, statusCode: 301 }]);
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe('use permanent or statusCode, not both');
    expect(RedirectsSchema.safeParse([{ from: '/a', to: '/b', permanent: false }]).success).toBe(true);
  });
  it('rejects an unsupported statusCode', () => {
    expect(RedirectsSchema.safeParse([{ from: '/a', to: '/b', statusCode: 200 }]).success).toBe(false);
  });
  it('validates /feed.xml -> /vi/feed.xml but rejects /vi/feed.xml as a from', () => {
    const run = (json: unknown) => validateAll(path.join(site(json), 'posts'), vocab, { today: '2026-10-22' }).findings.filter((f) => f.rule === 'redirects');
    expect(run([{ from: '/feed.xml', to: '/vi/feed.xml', statusCode: 301 }])).toEqual([]);
    expect(run([{ from: '/vi/feed.xml', to: '/vi' }])).toHaveLength(1);
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
    expect(run([{ from: '/x', to: '/\\evil.dev' }])).toHaveLength(1);
  });
  it('compares from case-insensitively against live routes', () => {
    expect(run([{ from: '/VI/Companies/Discord', to: '/vi' }])).toEqual([expect.objectContaining({ message: expect.stringContaining('live route') })]);
  });
  it('rejects to equal to from', () => {
    expect(run([{ from: '/loop', to: '/loop' }]).map((f) => f.message)).toContainEqual(expect.stringContaining('points to itself'));
  });
  it('rejects a to that is not a live route, ignoring hash and query', () => {
    expect(run([{ from: '/x', to: '/vi/nowhere' }])).toHaveLength(1);
    expect(run([{ from: '/x', to: '/vi/companies/discord?a=1#h' }])).toEqual([]);
    expect(run([{ from: '/x', to: '/vi/topics/data#top' }])).toEqual([]);
  });
  it('reports malformed JSON as one finding', () => {
    const dir = mkdtempSync(path.join(tmp, 's-'));
    mkdirSync(path.join(dir, 'posts'));
    writeFileSync(path.join(dir, 'redirects.json'), '{ not json');
    const f = validateAll(path.join(dir, 'posts'), vocab, { today: '2026-10-22' }).findings.filter((x) => x.rule === 'redirects');
    expect(f).toHaveLength(1);
  });
  it('treats a missing redirects.json as no findings', () => {
    const dir = mkdtempSync(path.join(tmp, 's-'));
    mkdirSync(path.join(dir, 'posts'));
    const f = validateAll(path.join(dir, 'posts'), vocab, { today: '2026-10-22' }).findings.filter((x) => x.rule === 'redirects');
    expect(f).toEqual([]);
  });
});
