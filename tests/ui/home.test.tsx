// @vitest-environment jsdom
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/vi',
}));

const GOOD = 'tests/fixtures/posts/good-post';
const META = JSON.parse(readFileSync(path.join(GOOD, 'post.json'), 'utf8'));
const VOCAB_FILES = ['companies', 'topics', 'tags', 'series', 'source-hosts', 'featured'];

type P = { slug: string; company?: string; topic?: string; publishedAt?: string };

const tmp = mkdtempSync(path.join(tmpdir(), 'home-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));
afterEach(() => vi.unstubAllEnvs());

let n = 0;
/** A temp content root and vocab root; never writes into fixtures or content/. */
function site(posts: P[], featured: string[] = []) {
  const root = path.join(tmp, `s${n++}`);
  const postsDir = path.join(root, 'posts');
  const vocabDir = path.join(root, 'vocab');
  mkdirSync(postsDir, { recursive: true });
  mkdirSync(vocabDir, { recursive: true });
  for (const f of VOCAB_FILES) cpSync(`content/${f}.json`, path.join(vocabDir, `${f}.json`));
  writeFileSync(path.join(vocabDir, 'featured.json'), JSON.stringify(featured));
  for (const p of posts) {
    const dir = path.join(postsDir, p.slug);
    cpSync(GOOD, dir, { recursive: true });
    writeFileSync(path.join(dir, 'post.json'), JSON.stringify({ ...META, ...p }));
  }
  return { postsDir, vocabDir };
}

async function load(s: { postsDir: string; vocabDir: string }) {
  vi.resetModules();
  vi.stubEnv('CONTENT_ROOT', s.postsDir);
  vi.stubEnv('VOCAB_ROOT', s.vocabDir);
  return import('@/app/[locale]/page');
}

async function render(s: { postsDir: string; vocabDir: string }, locale = 'vi') {
  const { default: Page } = await load(s);
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ locale }) }));
  const host = document.createElement('div');
  host.innerHTML = html;
  return { html, host };
}

function section(host: HTMLElement, heading: string): HTMLElement | null {
  const h2 = [...host.querySelectorAll('h2')].find((h) => h.textContent === heading);
  return (h2?.closest('section') as HTMLElement | null) ?? null;
}

const postHrefs = (el: HTMLElement | null, locale = 'vi') =>
  [...(el?.querySelectorAll(`a[href^="/${locale}/posts/"]`) ?? [])].map((a) => a.getAttribute('href'));

/** Ten posts, p0 newest: 2026-10-20, p1 2026-10-19, ... */
const TEN: P[] = Array.from({ length: 10 }, (_, i) => ({
  slug: `p${i}`,
  publishedAt: `2026-10-${String(20 - i).padStart(2, '0')}`,
  company: i < 6 ? 'discord' : 'cloudflare',
  topic: i % 2 === 0 ? 'data' : 'reliability',
}));

describe('home (vi)', () => {
  it('renders header, then main: h1, tagline, intro, start here, latest, by company, by topic', async () => {
    const { html } = await render(site(TEN));
    const at = (needle: string) => {
      const i = html.indexOf(needle);
      expect(i, `missing: ${needle}`).toBeGreaterThanOrEqual(0);
      return i;
    };
    const order = [
      at('href="#content"'),
      at('<main id="content" tabindex="-1"'),
      at('<h1'),
      at('Bài học từ hệ thống lớn, cho team nhỏ'),
      at('Các case study từ blog kỹ thuật'),
      at('>Bắt đầu từ đây</h2>'),
      at('>Mới nhất</h2>'),
      at('>Theo công ty</h2>'),
      at('>Theo chủ đề</h2>'),
    ];
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toContain('aria-label="Chuyển sang tiếng Anh (EN)"');
  });

  it('starts with featured slugs, then fills to three with the newest', async () => {
    const { host } = await render(site(TEN, ['p7']));
    expect(postHrefs(section(host, 'Bắt đầu từ đây'))).toEqual([
      '/vi/posts/p7',
      '/vi/posts/p0',
      '/vi/posts/p1',
    ]);
  });

  it('lists the six newest not already in start here, with no slug in both', async () => {
    const { host } = await render(site(TEN, ['p7']));
    const start = postHrefs(section(host, 'Bắt đầu từ đây'));
    const latest = postHrefs(section(host, 'Mới nhất'));
    expect(latest).toEqual(['p2', 'p3', 'p4', 'p5', 'p6', 'p8'].map((s) => `/vi/posts/${s}`));
    expect(latest.filter((h) => start.includes(h))).toEqual([]);
  });

  it('hides latest when every post is already in start here', async () => {
    const three = TEN.slice(0, 3);
    const { host, html } = await render(site(three, ['p0', 'p1', 'p2']));
    expect(postHrefs(section(host, 'Bắt đầu từ đây'))).toHaveLength(3);
    expect(section(host, 'Mới nhất')).toBeNull();
    expect(html).not.toContain('Mới nhất');
  });

  it('links companies with posts in an ink-letter row with counts, skipping empty ones', async () => {
    const { host } = await render(site(TEN));
    const row = section(host, 'Theo công ty')!;
    const links = [...row.querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/vi/companies/discord',
      '/vi/companies/cloudflare',
    ]);
    expect(links[0].textContent).toContain('Discord');
    expect(links[0].textContent).toContain('6');
    expect(links[1].textContent).toContain('4');
    const mark = links[0].querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(mark.textContent).toBe('D');
    expect(mark.className).toContain('text-ink');
    expect(row.innerHTML).not.toMatch(/style="[^"]*color/);
  });

  it('renders topic chips with counts linking to topic pages', async () => {
    const { host } = await render(site(TEN));
    const sec = section(host, 'Theo chủ đề')!;
    const all = [...sec.querySelectorAll('li > *')] as HTMLElement[];
    expect(all).toHaveLength(5);
    const chips = [...sec.querySelectorAll('a')];
    expect(chips.map((a) => a.getAttribute('href'))).toEqual(
      ['data', 'reliability'].map((t) => `/vi/topics/${t}`),
    );
    expect(all[1].textContent).toContain('Dữ liệu');
    expect(all[1].textContent).toContain('5');
    expect(all[2].textContent).toContain('0');
    for (const c of ['border', 'border-hairline-strong', 'rounded-md']) {
      expect(chips[0].className.split(' ')).toContain(c);
    }
  });

  it('renders zero-count topics as muted non-link chips', async () => {
    const { host } = await render(site(TEN));
    const all = [...section(host, 'Theo chủ đề')!.querySelectorAll('li > *')] as HTMLElement[];
    const zero = all.filter((e) => e.tagName !== 'A');
    expect(zero).toHaveLength(3);
    for (const z of zero) {
      expect(z.tagName).toBe('SPAN');
      expect(z.className.split(' ')).toContain('text-muted');
      expect(z.className.split(' ')).toContain('border-hairline-strong');
      expect(z.querySelector('.sr-only')).not.toBeNull();
    }
  });

  it('uses the tagline as the only h1, above the intro', async () => {
    const { host } = await render(site(TEN));
    const h1s = host.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toBe('Bài học từ hệ thống lớn, cho team nhỏ');
    expect(h1s[0].closest('header')!.textContent).toContain('Các case study từ blog kỹ thuật');
  });

  it('gives start here three columns at lg and latest two', async () => {
    const { host } = await render(site(TEN));
    expect(section(host, 'Bắt đầu từ đây')!.querySelector('ul')!.className).toContain('lg:grid-cols-3');
    expect(section(host, 'Mới nhất')!.querySelector('ul')!.className).toContain('lg:grid-cols-2');
  });

  it('gives bare counts sr-only plural text, hiding the digit from readers', async () => {
    const vi_ = (await render(site(TEN))).host;
    const company = section(vi_, 'Theo công ty')!.querySelector('a')!;
    expect([...company.querySelectorAll('span[aria-hidden="true"]')].map((s) => s.textContent)).toContain('6');
    expect(company.querySelector('.sr-only')!.textContent).toBe('6 bài');
    const topic = section(vi_, 'Theo chủ đề')!.querySelector('a[href="/vi/topics/data"]')!;
    expect(topic.querySelector('.sr-only')!.textContent).toBe('5 bài');
    const en = (await render(site(TEN.slice(0, 1)), 'en')).host;
    expect(section(en, 'By company')!.querySelector('.sr-only')!.textContent).toBe('1 post');
    expect(section(en, 'By topic')!.querySelector('a[href="/en/topics/data"] .sr-only')!.textContent).toBe('1 post');
  });

  it('uses the one shared chip class string for topic chips', async () => {
    const { CHIP } = await import('@/components/chip');
    const { host } = await render(site(TEN));
    const chip = section(host, 'Theo chủ đề')!.querySelector('a')!;
    expect(chip.className).toContain(CHIP);
    expect(chip.className).toContain('px-2 py-[3px] text-xs');
  });

  it('renders the en home in English', async () => {
    const { host, html } = await render(site(TEN), 'en');
    expect(postHrefs(section(host, 'Start here'), 'en')).toHaveLength(3);
    expect(section(host, 'Latest')).not.toBeNull();
    expect(section(host, 'By company')!.querySelector('a')!.getAttribute('href')).toBe('/en/companies/discord');
    expect(section(host, 'By topic')!.textContent).toContain('Data');
    expect(html).toContain('Lessons from big systems, for small teams');
  });

  it('exports metadata via buildMetadata', async () => {
    const { generateMetadata } = await load(site(TEN));
    const m = await generateMetadata({ params: Promise.resolve({ locale: 'vi' }) });
    expect(m.title).toBe('Hệ thống lớn');
    expect(m.description).toMatch(/^Các case study từ blog kỹ thuật/);
    expect(m.alternates).toEqual({
      canonical: '/vi',
      languages: { vi: '/vi', en: '/en', 'x-default': '/vi' },
    });
    expect(m.openGraph).toMatchObject({ locale: 'vi_VN', url: '/vi', title: 'Hệ thống lớn' });
    const en = await generateMetadata({ params: Promise.resolve({ locale: 'en' }) });
    expect(en.openGraph).toMatchObject({ locale: 'en_GB' });
    expect(en.description).toMatch(/^Case studies from the engineering blogs/);
  });
});
