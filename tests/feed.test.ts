// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cpSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { PostRecord } from '@/lib/content/load';
import type { Vocab } from '@/lib/content/vocab';

vi.mock('server-only', () => ({}));
afterEach(() => vi.unstubAllEnvs());

const SITE = 'https://example.test';
const vocab = {
  companies: [],
  topics: [{ slug: 'data', vi: 'Dữ liệu', en: 'Data' }],
  tags: [],
  series: {},
  sourceHosts: [],
  featured: [],
} as unknown as Vocab;

const dicts = {
  vi: { feed: { title: 'Hệ thống lớn: bài mới', description: 'Bài học', readMore: 'Đọc toàn bài' }, post: { tldr: 'TL;DR', smallTeam: 'Cho đội nhỏ' } },
  en: { feed: { title: 'Big systems: new posts', description: 'Lessons', readMore: 'Read the full post' }, post: { tldr: 'TL;DR', smallTeam: 'For a small team' } },
};

function doc(title: string, summary: string) {
  return {
    frontmatter: {
      title,
      summary,
      tldr: [`tldr one ${title}`, 'tldr two', 'tldr three'],
      keyNumberLabels: { k1: 'requests per second' },
      smallTeam: ['small one', 'small two'],
    },
    body: '## Deep layer heading\n\nDeep text',
    readingTime: { deep: 6, whole: 8 },
    refs: [],
    mermaidBlocks: [],
  };
}
function post(slug: string, publishedAt: string, locales: ('vi' | 'en')[], summary = 'A summary'): PostRecord {
  return {
    slug,
    dir: slug,
    meta: { slug, topic: 'data', publishedAt, keyNumbers: [{ id: 'k1', value: '5M', ref: 'S1' }] },
    locales: Object.fromEntries(locales.map((l) => [l, doc(`Title ${slug} ${l}`, summary)])),
  } as unknown as PostRecord;
}

const parse = (xml: string) => new DOMParser().parseFromString(xml, 'application/xml');
const items = (d: Document) => [...d.querySelectorAll('item')];

async function build(locale: 'vi' | 'en', posts: PostRecord[], siteUrl = SITE) {
  const { buildFeed } = await import('@/lib/feed');
  return buildFeed(locale, posts, vocab, dicts[locale], siteUrl);
}

describe('escapeXml', () => {
  it('escapes the five XML characters', async () => {
    const { escapeXml } = await import('@/lib/xml');
    expect(escapeXml(`a&b<c>d"e'f`)).toBe('a&amp;b&lt;c&gt;d&quot;e&#39;f');
  });
});

describe('buildFeed', () => {
  const nasty = post('nasty', '2026-10-03', ['vi', 'en'], 'R&D <fast> "quoted"');
  const posts = [nasty, post('vi-only', '2026-10-02', ['vi']), post('plain', '2026-10-01', ['vi', 'en'])];

  it('parses as XML and round-trips special characters in the summary', async () => {
    const d = parse(await build('vi', posts));
    expect(d.querySelector('parsererror')).toBeNull();
    const desc = items(d)[0].querySelector('description')!.textContent!;
    const html = new DOMParser().parseFromString(desc, 'text/html');
    expect(html.body.textContent).toContain('R&D <fast> "quoted"');
    expect(html.querySelector('fast')).toBeNull();
  });

  it('has the channel metadata', async () => {
    const d = parse(await build('vi', posts));
    const ch = d.querySelector('channel')!;
    expect(d.documentElement.getAttribute('version')).toBe('2.0');
    expect(ch.querySelector(':scope > title')!.textContent).toBe('Hệ thống lớn: bài mới');
    expect(ch.querySelector(':scope > link')!.textContent).toBe(`${SITE}/vi`);
    expect(ch.querySelector(':scope > description')!.textContent).toBe('Bài học');
    expect(ch.querySelector(':scope > language')!.textContent).toBe('vi');
    const self = [...ch.children].find((c) => c.tagName === 'atom:link')!;
    expect(self.getAttribute('rel')).toBe('self');
    expect(self.getAttribute('href')).toBe(`${SITE}/vi/feed.xml`);
    expect(ch.querySelector(':scope > lastBuildDate')!.textContent).toBe('Sat, 03 Oct 2026 00:00:00 GMT');
  });

  it('omits the vi-only post from the en feed', async () => {
    const xml = await build('en', posts);
    const d = parse(xml);
    expect(items(d).map((i) => i.querySelector('title')!.textContent)).toEqual(['Title nasty en', 'Title plain en']);
    expect(xml).not.toContain('vi-only');
    expect(d.querySelector('language')!.textContent).toBe('en');
  });

  it('makes every link absolute from the site URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', SITE);
    vi.resetModules();
    const { buildFeed } = await import('@/lib/feed');
    const { SITE_URL } = await import('@/lib/site');
    const d = parse(buildFeed('vi', posts, vocab, dicts.vi, SITE_URL));
    const links = [...d.querySelectorAll('channel > link, item > link, guid')]
      .filter((n) => n.tagName !== 'atom:link')
      .map((n) => n.textContent!);
    expect(links.length).toBe(1 + 2 * 3);
    for (const l of links) expect(l.startsWith(SITE)).toBe(true);
    expect(d.querySelector('[rel="self"]')!.getAttribute('href')!.startsWith(SITE)).toBe(true);
    const hrefs = [...d.querySelectorAll('item description')].flatMap((n) =>
      [...new DOMParser().parseFromString(n.textContent!, 'text/html').querySelectorAll('a')].map((a) => a.getAttribute('href')!),
    );
    expect(hrefs.length).toBe(3);
    for (const h of hrefs) expect(h.startsWith(SITE)).toBe(true);
    expect(d.querySelector('guid')!.getAttribute('isPermaLink')).toBe('true');
  });

  it('item: link, category, pubDate, and top layer in spec order without the deep layer', async () => {
    const d = parse(await build('vi', posts));
    const it0 = items(d)[0];
    expect(it0.querySelector('link')!.textContent).toBe(`${SITE}/vi/posts/nasty`);
    expect(it0.querySelector('guid')!.textContent).toBe(`${SITE}/vi/posts/nasty`);
    expect(it0.querySelector('category')!.textContent).toBe('Dữ liệu');
    expect(it0.querySelector('pubDate')!.textContent).toBe('Sat, 03 Oct 2026 00:00:00 GMT');
    const desc = it0.querySelector('description')!.textContent!;
    const html = new DOMParser().parseFromString(desc, 'text/html');
    const text = html.body.textContent!;
    const order = ['R&D', '5M', 'requests per second', 'TL;DR', 'tldr one', 'Cho đội nhỏ', 'small one', 'Đọc toàn bài'].map((s) => text.indexOf(s));
    expect(order.every((n) => n >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html.querySelectorAll('ul').length).toBe(3);
    expect(html.querySelector('p > a')!.textContent).toBe('Đọc toàn bài');
    expect(text).not.toContain('Deep layer heading');
    expect(text).not.toContain('Deep text');
  });

  it('is newest first and capped at 20', async () => {
    const many = Array.from({ length: 25 }, (_, i) => post(`p${i}`, `2026-09-${String(i + 1).padStart(2, '0')}`, ['vi']));
    const d = parse(await build('vi', many));
    const titles = items(d).map((i) => i.querySelector('title')!.textContent);
    expect(titles).toHaveLength(20);
    expect(titles[0]).toBe('Title p24 vi');
    expect(titles[19]).toBe('Title p5 vi');
  });

  it('sorts newest first even when input is unordered', async () => {
    const d = parse(await build('vi', [post('old', '2026-01-01', ['vi']), post('new', '2026-02-01', ['vi'])]));
    expect(items(d).map((i) => i.querySelector('title')!.textContent)).toEqual(['Title new vi', 'Title old vi']);
  });
});

describe('buildFeed edge cases', () => {
  it('an empty feed parses and has no lastBuildDate', async () => {
    const d = parse(await build('vi', []));
    expect(d.querySelector('parsererror')).toBeNull();
    expect(items(d)).toHaveLength(0);
    expect(d.querySelector('lastBuildDate')).toBeNull();
    expect(d.querySelector('channel > title')!.textContent).toBe('Hệ thống lớn: bài mới');
    expect(d.querySelector('channel > link')!.textContent).toBe(`${SITE}/vi`);
  });

  it('throws on an invalid publishedAt rather than emitting "Invalid Date"', async () => {
    await expect(build('vi', [post('bad', 'not-a-date', ['vi'])])).rejects.toThrow('invalid date: not-a-date');
  });
});

describe('feed route', () => {
  it('serves RSS with the right content type for a locale and 404s otherwise', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'feed-'));
    try {
      mkdirSync(path.join(root, 'posts'));
      cpSync(path.join(__dirname, 'fixtures', 'posts', 'good-post'), path.join(root, 'posts', 'good-post'), { recursive: true });
      writeFileSync(path.join(root, 'tags.json'), '[]');
      vi.resetModules();
      vi.stubEnv('CONTENT_ROOT', path.join(root, 'posts'));
      vi.stubEnv('VOCAB_ROOT', path.join(root, 'v'));
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', SITE);
      vi.doMock('@/lib/content/vocab', () => ({ loadVocab: () => vocab }));
      const route = await import('@/app/[locale]/feed.xml/route');
      expect(route.dynamic).toBe('force-static');
      expect(route.dynamicParams).toBe(false);
      expect(route.generateStaticParams()).toEqual([{ locale: 'vi' }, { locale: 'en' }]);
      const res = await route.GET(new Request(`${SITE}/vi/feed.xml`), { params: Promise.resolve({ locale: 'vi' }) });
      expect(res.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8');
      const feed = parse(await res.text());
      expect(feed.querySelector('parsererror')).toBeNull();
      expect(items(feed)).toHaveLength(1);
      expect(items(feed)[0].querySelector('link')!.textContent).toBe(`${SITE}/vi/posts/good-post`);
      const bad = await route.GET(new Request(`${SITE}/fr/feed.xml`), { params: Promise.resolve({ locale: 'fr' }) });
      expect(bad.status).toBe(404);
    } finally {
      vi.doUnmock('@/lib/content/vocab');
      rmSync(root, { recursive: true, force: true });
    }
  });
});
