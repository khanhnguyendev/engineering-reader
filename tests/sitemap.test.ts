import { afterEach, describe, expect, it, vi } from 'vitest';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

vi.mock('server-only', () => ({}));
afterEach(() => vi.unstubAllEnvs());

const SITE = 'https://example.test';
const VOCAB_FILES = ['companies', 'topics', 'tags', 'series', 'source-hosts', 'featured'];

async function load() {
  const root = mkdtempSync(path.join(tmpdir(), 'sitemap-'));
  const posts = path.join(root, 'posts');
  const vocabDir = path.join(root, 'vocab');
  mkdirSync(posts);
  mkdirSync(vocabDir);
  const good = path.join(posts, 'good-post');
  cpSync(path.join(__dirname, 'fixtures', 'posts', 'good-post'), good, { recursive: true });
  const viOnly = path.join(posts, 'vi-only');
  cpSync(good, viOnly, { recursive: true });
  const j = JSON.parse(readFileSync(path.join(viOnly, 'post.json'), 'utf8'));
  writeFileSync(path.join(viOnly, 'post.json'), JSON.stringify({ ...j, slug: 'vi-only' }));
  rmSync(path.join(viOnly, 'en.mdx'));
  const enOnly = path.join(posts, 'en-only');
  cpSync(good, enOnly, { recursive: true });
  const j2 = JSON.parse(readFileSync(path.join(enOnly, 'post.json'), 'utf8'));
  writeFileSync(path.join(enOnly, 'post.json'), JSON.stringify({ ...j2, slug: 'en-only' }));
  rmSync(path.join(enOnly, 'vi.mdx'));
  for (const f of VOCAB_FILES) cpSync(path.join(process.cwd(), 'content', `${f}.json`), path.join(vocabDir, `${f}.json`));
  const tags = JSON.parse(readFileSync(path.join(vocabDir, 'tags.json'), 'utf8'));
  writeFileSync(
    path.join(vocabDir, 'tags.json'),
    JSON.stringify([...tags, { slug: 'unused-tag', vi: 'Không dùng', en: 'Unused' }]),
  );
  vi.resetModules();
  vi.stubEnv('CONTENT_ROOT', posts);
  vi.stubEnv('VOCAB_ROOT', vocabDir);
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', SITE);
  const mod = await import('@/app/sitemap');
  return { root, entries: mod.default() };
}

describe('sitemap', () => {
  it('emits home twice, each with both alternates and x-default to vi', async () => {
    const { root, entries } = await load();
    try {
      const home = entries.filter((e) => e.url === `${SITE}/vi` || e.url === `${SITE}/en`);
      expect(home.map((e) => e.url)).toEqual([`${SITE}/vi`, `${SITE}/en`]);
      expect(home[0].alternates?.languages).toEqual({
        vi: `${SITE}/vi`,
        en: `${SITE}/en`,
        'x-default': `${SITE}/vi`,
      });
      expect(home[1].alternates?.languages).toEqual(home[0].alternates?.languages);
      expect(home[0].lastModified).toBeUndefined();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('gives a vi-only post a vi entry with no en alternate and no en entry', async () => {
    const { root, entries } = await load();
    try {
      const vi = entries.filter((e) => e.url === `${SITE}/vi/posts/vi-only`);
      expect(vi).toHaveLength(1);
      expect(vi[0].alternates?.languages).toEqual({ vi: `${SITE}/vi/posts/vi-only`, 'x-default': `${SITE}/vi/posts/vi-only` });
      expect(vi[0].lastModified).toBe('2026-10-21');
      expect(entries.filter((e) => e.url === `${SITE}/en/posts/vi-only`)).toHaveLength(0);
      const both = entries.filter((e) => e.url === `${SITE}/en/posts/good-post`);
      expect(both).toHaveLength(1);
      expect(Object.keys(both[0].alternates?.languages ?? {}).sort()).toEqual(['en', 'vi', 'x-default']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('gives an en-only post an en entry with only an en alternate and no x-default', async () => {
    const { root, entries } = await load();
    try {
      const en = entries.filter((e) => e.url === `${SITE}/en/posts/en-only`);
      expect(en).toHaveLength(1);
      expect(en[0].alternates?.languages).toEqual({ en: `${SITE}/en/posts/en-only` });
      expect(entries.filter((e) => e.url === `${SITE}/vi/posts/en-only`)).toHaveLength(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('has no entry for an unused tag but has one for a used tag', async () => {
    const { root, entries } = await load();
    try {
      expect(entries.filter((e) => e.url.includes('unused-tag'))).toHaveLength(0);
      expect(entries.filter((e) => e.url === `${SITE}/vi/tags/cassandra`)).toHaveLength(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('starts every URL and alternate with the stubbed site URL', async () => {
    const { root, entries } = await load();
    try {
      expect(entries.length).toBeGreaterThan(10);
      const urls = entries.flatMap((e) => [e.url, ...Object.values(e.alternates?.languages ?? {}).map(String)]);
      expect(urls.length).toBeGreaterThan(20);
      expect(urls.filter((u) => !u.startsWith(`${SITE}/`))).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('robots', () => {
  it('allows everything, never disallows /og/, and points at the sitemap', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', SITE);
    const robots = (await import('@/app/robots')).default();
    const rules = Array.isArray(robots.rules) ? robots.rules : [robots.rules];
    expect(rules).toEqual([{ userAgent: '*', allow: '/' }]);
    const disallow = rules.flatMap((r) => (r.disallow === undefined ? [] : [r.disallow].flat()));
    expect(disallow.filter((d) => d.includes('/og/'))).toEqual([]);
    expect(robots.sitemap).toBe(`${SITE}/sitemap.xml`);
    expect(robots.host).toBe(SITE);
  });
});
