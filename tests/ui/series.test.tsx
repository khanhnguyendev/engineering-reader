// @vitest-environment jsdom
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/vi/series/scaling',
}));

const GOOD = 'tests/fixtures/posts/good-post';
const META = JSON.parse(readFileSync(path.join(GOOD, 'post.json'), 'utf8'));
const VOCAB_FILES = ['companies', 'topics', 'tags', 'series', 'source-hosts', 'featured'];

type P = { slug: string; series?: string | null; enDraft?: boolean };
type Site = { postsDir: string; vocabDir: string };

const SERIES = {
  scaling: { slugs: ['s1', 's2', 'gone', 's3'], vi: 'Mở rộng quy mô', en: 'Scaling up' },
  solo: { slugs: ['o1'], vi: 'Một mình', en: 'Alone' },
};

const tmp = mkdtempSync(path.join(tmpdir(), 'series-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));
afterEach(() => vi.unstubAllEnvs());

let n = 0;
function site(posts: P[]): Site {
  const root = path.join(tmp, `s${n++}`);
  const postsDir = path.join(root, 'posts');
  const vocabDir = path.join(root, 'vocab');
  mkdirSync(postsDir, { recursive: true });
  mkdirSync(vocabDir, { recursive: true });
  for (const f of VOCAB_FILES) cpSync(`content/${f}.json`, path.join(vocabDir, `${f}.json`));
  writeFileSync(path.join(vocabDir, 'series.json'), JSON.stringify(SERIES));
  for (const { enDraft, ...p } of posts) {
    const dir = path.join(postsDir, p.slug);
    cpSync(GOOD, dir, { recursive: true });
    writeFileSync(path.join(dir, 'post.json'), JSON.stringify({ ...META, series: null, ...p }));
    if (enDraft) {
      const en = path.join(dir, 'en.mdx');
      writeFileSync(en, readFileSync(en, 'utf8').replace(/^---\n/, '---\ndraft: true\n'));
    }
  }
  return { postsDir, vocabDir };
}

function stub(s: Site) {
  vi.resetModules();
  vi.stubEnv('CONTENT_ROOT', s.postsDir);
  vi.stubEnv('VOCAB_ROOT', s.vocabDir);
}

const POSTS: P[] = [
  { slug: 's1', series: 'scaling' },
  { slug: 's2', series: 'scaling' },
  { slug: 's3', series: 'scaling', enDraft: true },
];

async function renderSeries(s: Site, locale: string, series = 'scaling') {
  stub(s);
  const { default: Page } = await import('@/app/[locale]/series/[series]/page');
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(await Page({ params: Promise.resolve({ locale, series }) }));
  return host;
}

describe('series page', () => {
  it('renders the vi title, the count and the posts in the series order with part labels', async () => {
    const host = await renderSeries(site(POSTS), 'vi');
    const main = host.querySelector('main#content')!;
    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(main.querySelector('h1')!.textContent).toBe('Mở rộng quy mô');
    expect(main.querySelector('header p')!.textContent).toBe('3 bài');
    const items = [...main.querySelectorAll('ol > li')];
    expect(items.map((li) => li.querySelector('a')!.getAttribute('href'))).toEqual([
      '/vi/posts/s1',
      '/vi/posts/s2',
      '/vi/posts/s3',
    ]);
    for (const li of items) {
      const title = li.querySelector('a > span:first-child')!;
      expect(title.className).toContain('font-bold');
      expect(title.nextElementSibling!.classList.contains('mono-label')).toBe(true);
    }
    expect(items.map((li) => li.querySelector('.mono-label')!.textContent)).toEqual([
      'Phần 1/3',
      'Phần 2/3',
      'Phần 3/3',
    ]);
  });

  it('renders the en page with only en posts, renumbered, and English labels', async () => {
    const host = await renderSeries(site(POSTS), 'en');
    expect(host.querySelector('h1')!.textContent).toBe('Scaling up');
    expect(host.querySelector('main header p')!.textContent).toBe('2 posts');
    const items = [...host.querySelectorAll('ol > li')];
    expect(items.map((li) => li.querySelector('a')!.getAttribute('href'))).toEqual([
      '/en/posts/s1',
      '/en/posts/s2',
    ]);
    expect(items[1].textContent).toContain('Part 2 of 2');
    expect(host.innerHTML).not.toContain('Phần');
  });

  it('is static: one entry per series and locale, nothing dynamic', async () => {
    stub(site(POSTS));
    const mod = await import('@/app/[locale]/series/[series]/page');
    expect(mod.dynamicParams).toBe(false);
    expect(mod.generateStaticParams()).toEqual([
      { locale: 'vi', series: 'scaling' },
      { locale: 'en', series: 'scaling' },
      { locale: 'vi', series: 'solo' },
      { locale: 'en', series: 'solo' },
    ]);
  });

  it('shows the localized empty state, not "0 posts" over an empty list, when no post exists in the locale', async () => {
    const s = site(POSTS.map((p) => ({ ...p, enDraft: true })));
    const en = await renderSeries(s, 'en');
    expect(en.querySelector('ol')).toBeNull();
    expect(en.querySelector('main header p')).toBeNull();
    expect(en.querySelector('main p.text-muted')!.textContent).toBe('No posts in this series yet.');
    const vi_ = await renderSeries(s, 'vi');
    expect(vi_.querySelectorAll('ol > li')).toHaveLength(3);
    expect(vi_.textContent).not.toContain('Chưa có bài nào');
    expect((await renderSeries(s, 'vi', 'solo')).querySelector('main p.text-muted')!.textContent).toBe(
      'Chưa có bài nào trong loạt này.',
    );
  });

  // Deliberate tripwire on the live content: when the first real series ships, change `[]` to its
  // { locale, series } pairs (and ensure its posts exist in content/posts).
  it('has no static params when series.json is empty (the live content today)', async () => {
    vi.resetModules();
    vi.stubEnv('VOCAB_ROOT', 'content');
    const mod = await import('@/app/[locale]/series/[series]/page');
    expect(mod.generateStaticParams()).toEqual([]);
  });

  it('404s for an unknown series or locale, including Object.prototype names', async () => {
    stub(site(POSTS));
    const { default: Page } = await import('@/app/[locale]/series/[series]/page');
    for (const [locale, series] of [['vi', 'nope'], ['fr', 'scaling'], ['vi', 'constructor']]) {
      await expect(Page({ params: Promise.resolve({ locale, series }) })).rejects.toMatchObject({
        digest: expect.stringContaining('404'),
      });
    }
  });

  it('exports metadata via buildMetadata', async () => {
    stub(site(POSTS));
    const { generateMetadata } = await import('@/app/[locale]/series/[series]/page');
    const m = await generateMetadata({ params: Promise.resolve({ locale: 'en', series: 'scaling' }) });
    expect(m.title).toBe('Scaling up · Hệ thống lớn');
    expect(m.description).toBe('Scaling up: 2 posts');
    expect(m.alternates).toMatchObject({
      canonical: '/en/series/scaling',
      languages: { vi: '/vi/series/scaling', en: '/en/series/scaling', 'x-default': '/vi/series/scaling' },
    });
    expect(m.openGraph).toMatchObject({ locale: 'en_GB', url: '/en/series/scaling' });
    expect(await generateMetadata({ params: Promise.resolve({ locale: 'en', series: 'nope' }) })).toEqual({});
  });
});

async function renderPost(s: Site, locale: string, slug: string) {
  stub(s);
  const { default: Page } = await import('@/app/[locale]/posts/[slug]/page');
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(await Page({ params: Promise.resolve({ locale, slug }) }));
  return host;
}

const seriesNav = (host: HTMLElement) => host.querySelector('nav[aria-label^="Loạt bài"], nav[aria-label^="Series"]');

describe('post page series block', () => {
  const ALL: P[] = [...POSTS.map((p) => ({ ...p, enDraft: false })), { slug: 'o1', series: 'solo' }];

  it('middle post shows part label, series link, prev and next', async () => {
    const host = await renderPost(site(ALL), 'vi', 's2');
    const nav = seriesNav(host)!;
    expect(nav.textContent).toContain('Phần 2/3');
    expect(nav.textContent).toContain('Mở rộng quy mô');
    expect(nav.querySelector('a[href="/vi/series/scaling"]')!.textContent).toBe('Xem cả loạt bài');
    expect(nav.querySelector('a[rel="prev"]')!.getAttribute('href')).toBe('/vi/posts/s1');
    expect(nav.querySelector('a[rel="next"]')!.getAttribute('href')).toBe('/vi/posts/s3');
    expect(nav.textContent).toContain('Bài trước');
    expect(nav.textContent).toContain('Bài sau');
  });

  it('first post has next only, last has prev only; en uses English labels', async () => {
    const s = site(ALL);
    const first = seriesNav(await renderPost(s, 'en', 's1'))!;
    expect(first.querySelector('a[rel="prev"]')).toBeNull();
    expect(first.querySelector('a[rel="next"]')!.getAttribute('href')).toBe('/en/posts/s2');
    expect(first.textContent).toContain('Part 1 of 3');
    expect(first.textContent).toContain('View the series');
    const last = seriesNav(await renderPost(s, 'vi', 's3'))!;
    expect(last.querySelector('a[rel="next"]')).toBeNull();
    expect(last.querySelector('a[rel="prev"]')!.getAttribute('href')).toBe('/vi/posts/s2');
  });

  it('mounts after the byline and before Related', async () => {
    const host = await renderPost(site(ALL), 'vi', 's2');
    const html = host.innerHTML;
    const byline = html.indexOf('Soạn thảo với AI');
    const nav = html.indexOf('/vi/series/scaling');
    const related = html.indexOf('Bài liên quan');
    expect(byline).toBeGreaterThan(0);
    expect(byline).toBeLessThan(nav);
    expect(nav).toBeLessThan(related);
  });

  it('a single-post series shows the block with neither prev nor next', async () => {
    const nav = seriesNav(await renderPost(site(ALL), 'vi', 'o1'))!;
    expect(nav.textContent).toContain('Phần 1/1');
    expect(nav.querySelector('a[rel="prev"]')).toBeNull();
    expect(nav.querySelector('a[rel="next"]')).toBeNull();
  });

  it('a post whose slug is not listed in its series gets no series block', async () => {
    const host = await renderPost(site([...ALL, { slug: 'x1', series: 'scaling' }]), 'vi', 'x1');
    expect(seriesNav(host)).toBeNull();
    expect(host.innerHTML).not.toContain('/vi/series/');
  });

  it('a post with no series gets no series block', async () => {
    const host = await renderPost(site([...ALL, { slug: 'plain' }]), 'vi', 'plain');
    expect(seriesNav(host)).toBeNull();
  });
});

describe('post page related block', () => {
  const rel = (host: HTMLElement) =>
    [...host.querySelectorAll('section')]
      .find((s) => s.querySelector('h2')?.textContent === 'Bài liên quan');
  const hrefs = (el: Element | undefined) =>
    [...(el?.querySelectorAll('a[href^="/vi/posts/"]') ?? [])].map((a) => a.getAttribute('href'));

  type R = P & { company?: string; topic?: string; publishedAt?: string };
  const ranked: R[] = [
    { slug: 'me', company: 'discord', topic: 'data', publishedAt: '2026-10-01' },
    { slug: 'c-old', company: 'discord', topic: 'infra', publishedAt: '2026-10-02' },
    { slug: 't-old', company: 'netflix', topic: 'data', publishedAt: '2026-10-03' },
    { slug: 't-new', company: 'netflix', topic: 'data', publishedAt: '2026-10-10' },
    { slug: 'c-new', company: 'discord', topic: 'infra', publishedAt: '2026-10-11' },
    { slug: 'other', company: 'netflix', topic: 'infra', publishedAt: '2026-10-12' },
  ];

  it('lists same-topic first then same-company, newest first, max three, excluding itself', async () => {
    const host = await renderPost(site(ranked as P[]), 'vi', 'me');
    expect(hrefs(rel(host))).toEqual(['/vi/posts/t-new', '/vi/posts/t-old', '/vi/posts/c-new']);
  });

  it('shows English heading on en', async () => {
    const host = await renderPost(site(ranked as P[]), 'en', 'me');
    expect([...host.querySelectorAll('h2')].some((h) => h.textContent === 'Related cases')).toBe(true);
  });

  it('is hidden entirely, heading included, when nothing is related', async () => {
    const host = await renderPost(site([{ slug: 'lonely' }]), 'vi', 'lonely');
    expect(rel(host)).toBeUndefined();
    expect(host.innerHTML).not.toContain('Bài liên quan');
  });
});
