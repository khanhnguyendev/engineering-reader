// @vitest-environment jsdom
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/vi/topics',
}));

const GOOD = 'tests/fixtures/posts/good-post';
const META = JSON.parse(readFileSync(path.join(GOOD, 'post.json'), 'utf8'));
const VOCAB_FILES = ['companies', 'topics', 'tags', 'series', 'source-hosts', 'featured'];

type P = { slug: string; topic?: string; publishedAt?: string };
type Site = { postsDir: string; vocabDir: string };

const tmp = mkdtempSync(path.join(tmpdir(), 'topics-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));
afterEach(() => vi.unstubAllEnvs());

let n = 0;
/** A temp content root and vocab root; never writes into fixtures or content/. */
function site(posts: P[]): Site {
  const root = path.join(tmp, `s${n++}`);
  const postsDir = path.join(root, 'posts');
  const vocabDir = path.join(root, 'vocab');
  mkdirSync(postsDir, { recursive: true });
  mkdirSync(vocabDir, { recursive: true });
  for (const f of VOCAB_FILES) cpSync(`content/${f}.json`, path.join(vocabDir, `${f}.json`));
  for (const p of posts) {
    const dir = path.join(postsDir, p.slug);
    cpSync(GOOD, dir, { recursive: true });
    writeFileSync(path.join(dir, 'post.json'), JSON.stringify({ ...META, ...p }));
  }
  return { postsDir, vocabDir };
}

function stub(s: Site) {
  vi.resetModules();
  vi.stubEnv('CONTENT_ROOT', s.postsDir);
  vi.stubEnv('VOCAB_ROOT', s.vocabDir);
}

function dom(html: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host;
}

async function renderIndex(s: Site, locale = 'vi') {
  stub(s);
  const { default: Page } = await import('@/app/[locale]/topics/page');
  return dom(renderToStaticMarkup(await Page({ params: Promise.resolve({ locale }) })));
}

async function renderTopic(s: Site, locale: string, topic: string) {
  stub(s);
  const { default: Page } = await import('@/app/[locale]/topics/[topic]/page');
  return dom(renderToStaticMarkup(await Page({ params: Promise.resolve({ locale, topic }) })));
}

const SITE: P[] = [
  { slug: 'a', topic: 'data', publishedAt: '2026-10-20' },
  { slug: 'b', topic: 'data', publishedAt: '2026-10-19' },
  { slug: 'c', topic: 'reliability', publishedAt: '2026-10-18' },
];
const SLUGS = ['distributed-systems', 'data', 'realtime', 'infra', 'reliability'];

describe('topics index', () => {
  it('renders five shelves as panel links with label, shelf dek and count', async () => {
    const host = await renderIndex(site(SITE));
    const main = host.querySelector('main#content')!;
    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(main.querySelector('h1')!.textContent).toBe('Chủ đề');
    expect(main.textContent).toContain('Năm kệ sách cho cùng một câu hỏi');
    const shelves = [...main.querySelectorAll('main li > *')];
    expect(shelves).toHaveLength(SLUGS.length);
    expect(shelves.map((a) => a.getAttribute('href'))).toEqual(
      SLUGS.map((s) => (s === 'data' || s === 'reliability' ? `/vi/topics/${s}` : null)),
    );
    const data = shelves[1];
    expect(data.className.split(' ')).toContain('panel');
    expect(data.querySelector('h2')!.textContent).toBe('Dữ liệu');
    expect(data.textContent).toContain('Lưu trữ, sharding, migration');
    expect(data.textContent).toContain('2 bài');
  });

  it('renders a topic with no posts as a muted non-link panel that keeps its count line', async () => {
    const host = await renderIndex(site(SITE));
    const empty = [...host.querySelectorAll('main li > *')][2] as HTMLElement;
    expect(empty.tagName).toBe('DIV');
    expect(empty.querySelector('a')).toBeNull();
    expect(empty.className.split(' ')).toContain('panel');
    expect(empty.className).not.toContain('hover:');
    expect(empty.querySelector('h2')!.className.split(' ')).toContain('text-muted');
    expect(empty.querySelector('p')!.className.split(' ')).toContain('text-ink-2');
    expect(empty.textContent).toContain('0 bài');
  });

  it('renders the en index with English labels and plural counts', async () => {
    const host = await renderIndex(site(SITE), 'en');
    const shelves = [...host.querySelectorAll('main li > *')];
    expect(shelves[1].getAttribute('href')).toBe('/en/topics/data');
    expect(shelves[1].querySelector('h2')!.textContent).toBe('Data');
    expect(shelves[1].textContent).toContain('2 posts');
    expect(shelves[4].textContent).toContain('1 post');
    expect(shelves[4].textContent).not.toContain('1 posts');
  });

  it('exports metadata via buildMetadata', async () => {
    stub(site(SITE));
    const { generateMetadata } = await import('@/app/[locale]/topics/page');
    const m = await generateMetadata({ params: Promise.resolve({ locale: 'vi' }) });
    expect(m.title).toBe('Chủ đề · Hệ thống lớn');
    expect(m.description).toMatch(/^Năm kệ sách/);
    expect(m.alternates?.canonical).toBe('/vi/topics');
    expect(m.openGraph).toMatchObject({ locale: 'vi_VN', url: '/vi/topics' });
  });
});

describe('topic page', () => {
  it('renders the intro with label and shelf dek, then the posts under an h2', async () => {
    const host = await renderTopic(site(SITE), 'vi', 'data');
    const main = host.querySelector('main#content')!;
    expect(main.querySelector('h1')!.textContent).toBe('Dữ liệu');
    expect(main.querySelector('main header p')!.textContent).toMatch(/^Lưu trữ, sharding, migration/);
    expect(main.querySelector('h2')!.textContent).toBe('Bài viết');
    const hrefs = [...main.querySelectorAll('a[href^="/vi/posts/"]')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/vi/posts/a', '/vi/posts/b']);
  });

  it('shows the localized empty state for a topic with no posts', async () => {
    const s = site(SITE);
    expect((await renderTopic(s, 'vi', 'realtime')).textContent).toContain('Chưa có bài nào thuộc chủ đề này.');
    const en = await renderTopic(s, 'en', 'realtime');
    expect(en.querySelector('h1')!.textContent).toBe('Realtime');
    expect(en.textContent).toContain('No posts on this topic yet.');
  });

  it('404s for an unknown topic or locale', async () => {
    stub(site(SITE));
    const { default: Page } = await import('@/app/[locale]/topics/[topic]/page');
    await expect(Page({ params: Promise.resolve({ locale: 'vi', topic: 'nope' }) })).rejects.toMatchObject({
      digest: expect.stringContaining('404'),
    });
    await expect(Page({ params: Promise.resolve({ locale: 'fr', topic: 'data' }) })).rejects.toMatchObject({
      digest: expect.stringContaining('404'),
    });
  });

  it('is static: five topics in both locales', async () => {
    stub(site(SITE));
    const mod = await import('@/app/[locale]/topics/[topic]/page');
    expect(mod.dynamicParams).toBe(false);
    const params = mod.generateStaticParams();
    expect(params).toHaveLength(10);
    expect(params).toContainEqual({ locale: 'en', topic: 'realtime' });
  });

  it('exports metadata via buildMetadata', async () => {
    stub(site(SITE));
    const { generateMetadata } = await import('@/app/[locale]/topics/[topic]/page');
    const m = await generateMetadata({ params: Promise.resolve({ locale: 'en', topic: 'data' }) });
    expect(m.title).toBe('Data · Hệ thống lớn');
    expect(m.description).toMatch(/^Storage, sharding, migrations/);
    expect(m.alternates?.canonical).toBe('/en/topics/data');
    expect(m.openGraph).toMatchObject({ locale: 'en_GB' });
    expect(await generateMetadata({ params: Promise.resolve({ locale: 'en', topic: 'nope' }) })).toEqual({});
  });
});
