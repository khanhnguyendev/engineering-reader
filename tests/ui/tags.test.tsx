// @vitest-environment jsdom
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/vi/tags',
}));

const GOOD = 'tests/fixtures/posts/good-post';
const META = JSON.parse(readFileSync(path.join(GOOD, 'post.json'), 'utf8'));
const VOCAB_FILES = ['companies', 'topics', 'tags', 'series', 'source-hosts', 'featured'];

/**
 * Slug order (a, b, c, cassandra) differs from both label orders; the vi order
 * (Ă < B < Cassandra < Ư) differs from code-point order (B < C < Ă < Ư).
 */
const TAGS = [
  { slug: 'a-zeta', vi: 'Ư', en: 'Zeta' },
  { slug: 'b-alpha', vi: 'Ă', en: 'Alpha' },
  { slug: 'c-mid', vi: 'B', en: 'Mid' },
  { slug: 'cassandra', vi: 'Cassandra', en: 'Cassandra' },
];

type P = { slug: string; tags?: string[]; publishedAt?: string };
type Site = { postsDir: string; vocabDir: string };

const tmp = mkdtempSync(path.join(tmpdir(), 'tags-'));
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
  writeFileSync(path.join(vocabDir, 'tags.json'), JSON.stringify(TAGS));
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
  const { default: Page } = await import('@/app/[locale]/tags/page');
  return dom(renderToStaticMarkup(await Page({ params: Promise.resolve({ locale }) })));
}

async function renderTag(s: Site, locale: string, tag: string) {
  stub(s);
  const { default: Page } = await import('@/app/[locale]/tags/[tag]/page');
  return dom(renderToStaticMarkup(await Page({ params: Promise.resolve({ locale, tag }) })));
}

const SITE: P[] = [
  { slug: 'p1', tags: ['cassandra', 'a-zeta'], publishedAt: '2026-10-20' },
  { slug: 'p2', tags: ['cassandra', 'a-zeta'], publishedAt: '2026-10-19' },
];

describe('tags index', () => {
  it('lists every vocab tag as a chip with its count, sorted by the vi label', async () => {
    const host = await renderIndex(site(SITE));
    const main = host.querySelector('main#content')!;
    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(main.querySelector('h1')!.textContent).toBe('Thẻ');
    expect(main.textContent).toContain('Mọi công nghệ và kỹ thuật');
    const chips = [...main.querySelectorAll('li > a, li > span')];
    expect(chips.map((a) => a.getAttribute('href'))).toEqual(
      [null, null, '/vi/tags/cassandra', '/vi/tags/a-zeta'],
    );
    expect(chips[2].textContent).toContain('Cassandra');
    expect(chips[2].textContent).toContain('2');
    expect(chips[2].querySelector('span[aria-hidden="true"]')!.textContent).toBe('2');
    expect(chips[2].querySelector('.sr-only')!.textContent).toBe('2 bài');
    expect(chips[0].textContent).toContain('0');
    for (const c of ['border', 'border-hairline-strong', 'rounded-md']) {
      expect(chips[0].className.split(' ')).toContain(c);
    }
  });

  it('does not link a tag no post uses; it is a muted span that keeps its count', async () => {
    const host = await renderIndex(site(SITE));
    const unused = [...host.querySelectorAll('main li')].find((li) => li.textContent!.includes('Ă'))!;
    expect(unused.querySelector('a')).toBeNull();
    const chip = unused.querySelector('span')!;
    expect(chip.className.split(' ')).toContain('text-muted');
    expect(unused.querySelector('.sr-only')!.textContent).toBe('0 bài');
    expect(host.querySelectorAll('main li > a')).toHaveLength(2);
  });

  it('sorts by the en label on the en index', async () => {
    const host = await renderIndex(site(SITE), 'en');
    const chips = [...host.querySelectorAll('main li > a, main li > span')];
    expect(chips.map((a) => a.getAttribute('href'))).toEqual([null, '/en/tags/cassandra', null, '/en/tags/a-zeta']);
    expect(chips[0].textContent).toContain('Alpha');
  });

  it('exports metadata via buildMetadata', async () => {
    stub(site(SITE));
    const { generateMetadata } = await import('@/app/[locale]/tags/page');
    const m = await generateMetadata({ params: Promise.resolve({ locale: 'en' }) });
    expect(m.title).toBe('Tags · Hệ thống lớn');
    expect(m.description).toMatch(/^Every technology and technique/);
    expect(m.alternates?.canonical).toBe('/en/tags');
    expect(m.openGraph).toMatchObject({ locale: 'en_GB', url: '/en/tags' });
  });
});

describe('tag page', () => {
  it('advertises only the locales that have posts as hreflang alternates', async () => {
    const s = site([{ slug: 'p1', tags: ['cassandra', 'a-zeta'] }]);
    rmSync(path.join(s.postsDir, 'p1', 'en.mdx'));
    stub(s);
    const { generateMetadata } = await import('@/app/[locale]/tags/[tag]/page');
    const m = await generateMetadata({ params: Promise.resolve({ locale: 'vi', tag: 'cassandra' }) });
    expect(m.alternates?.languages).toEqual({ vi: '/vi/tags/cassandra', 'x-default': '/vi/tags/cassandra' });
  });

  it('renders the intro with label and count, then the posts under an h2', async () => {
    const host = await renderTag(site(SITE), 'vi', 'cassandra');
    const main = host.querySelector('main#content')!;
    expect(main.querySelector('h1')!.textContent).toBe('Cassandra');
    expect(main.querySelector('main header p')!.textContent).toBe('2 bài');
    expect(main.querySelector('h2')!.textContent).toBe('Bài viết');
    const hrefs = [...main.querySelectorAll('a[href^="/vi/posts/"]')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/vi/posts/p1', '/vi/posts/p2']);
  });

  it('Review Focus 2: a vocab tag no post uses still has a page with the empty state', async () => {
    const s = site(SITE);
    const vi_ = await renderTag(s, 'vi', 'b-alpha');
    expect(vi_.querySelector('h1')!.textContent).toBe('Ă');
    expect(vi_.textContent).toContain('Chưa có bài nào gắn thẻ này.');
    const en = await renderTag(s, 'en', 'b-alpha');
    expect(en.querySelector('h1')!.textContent).toBe('Alpha');
    expect(en.querySelector('main header p')!.textContent).toBe('0 posts');
    expect(en.textContent).toContain('No posts with this tag yet.');
    stub(s);
    const mod = await import('@/app/[locale]/tags/[tag]/page');
    expect(mod.generateStaticParams()).toContainEqual({ locale: 'en', tag: 'b-alpha' });
  });

  it('404s for an unknown tag or locale', async () => {
    stub(site(SITE));
    const { default: Page } = await import('@/app/[locale]/tags/[tag]/page');
    await expect(Page({ params: Promise.resolve({ locale: 'vi', tag: 'nope' }) })).rejects.toMatchObject({
      digest: expect.stringContaining('404'),
    });
    await expect(Page({ params: Promise.resolve({ locale: 'fr', tag: 'cassandra' }) })).rejects.toMatchObject({
      digest: expect.stringContaining('404'),
    });
  });

  it('is static: every vocab tag in both locales', async () => {
    stub(site(SITE));
    const mod = await import('@/app/[locale]/tags/[tag]/page');
    expect(mod.dynamicParams).toBe(false);
    expect(mod.generateStaticParams()).toHaveLength(TAGS.length * 2);
  });

  it('exports metadata via buildMetadata', async () => {
    stub(site(SITE));
    const { generateMetadata } = await import('@/app/[locale]/tags/[tag]/page');
    const m = await generateMetadata({ params: Promise.resolve({ locale: 'vi', tag: 'cassandra' }) });
    expect(m.title).toBe('Cassandra · Hệ thống lớn');
    expect(m.description).toBe('Cassandra: 2 bài');
    expect(m.alternates?.canonical).toBe('/vi/tags/cassandra');
    expect(await generateMetadata({ params: Promise.resolve({ locale: 'vi', tag: 'nope' }) })).toEqual({});
  });
});
