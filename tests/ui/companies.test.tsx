// @vitest-environment jsdom
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/vi/companies',
}));

const GOOD = 'tests/fixtures/posts/good-post';
const META = JSON.parse(readFileSync(path.join(GOOD, 'post.json'), 'utf8'));
const VOCAB_FILES = ['companies', 'topics', 'tags', 'series', 'source-hosts', 'featured'];

/** Inline so the test never depends on the live content/companies.json. */
const COMPANIES = [
  { slug: 'discord', name: 'Discord', blogUrl: 'https://discord.com/blog', feedUrl: 'https://discord.com/blog/rss.xml', brandColor: '#5865F2', logo: 'public/logos/discord.svg' },
  { slug: 'cloudflare', name: 'Cloudflare', blogUrl: 'https://blog.cloudflare.com', feedUrl: 'https://blog.cloudflare.com/rss/', brandColor: '#F38020', logo: 'public/logos/cloudflare.svg' },
  { slug: 'netflix', name: 'Netflix', blogUrl: 'https://netflixtechblog.com', feedUrl: 'https://netflixtechblog.com/feed', brandColor: '#E50914', logo: 'public/logos/netflix.svg' },
];

type P = { slug: string; company?: string; publishedAt?: string; enDraft?: boolean };
type Site = { postsDir: string; vocabDir: string };

const tmp = mkdtempSync(path.join(tmpdir(), 'companies-'));
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
  writeFileSync(path.join(vocabDir, 'companies.json'), JSON.stringify(COMPANIES));
  for (const { enDraft, ...p } of posts) {
    const dir = path.join(postsDir, p.slug);
    cpSync(GOOD, dir, { recursive: true });
    writeFileSync(path.join(dir, 'post.json'), JSON.stringify({ ...META, ...p }));
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

function dom(html: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host;
}

async function renderIndex(s: Site, locale = 'vi') {
  stub(s);
  const { default: Page } = await import('@/app/[locale]/companies/page');
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ locale }) }));
  return { html, host: dom(html) };
}

async function renderCompany(s: Site, locale: string, company: string) {
  stub(s);
  const { default: Page } = await import('@/app/[locale]/companies/[company]/page');
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ locale, company }) }));
  return { html, host: dom(html) };
}

const SITE: P[] = [
  { slug: 'd1', company: 'discord', publishedAt: '2026-10-20' },
  { slug: 'd2', company: 'discord', publishedAt: '2026-10-19' },
  { slug: 'c1', company: 'cloudflare', publishedAt: '2026-10-18' },
  { slug: 'n1', company: 'netflix', publishedAt: '2026-10-17', enDraft: true },
];

describe('companies index', () => {
  it('has the skip target, a page intro and a card per vocab company', async () => {
    const { host } = await renderIndex(site(SITE));
    const main = host.querySelector('main#content')!;
    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(main.querySelector('h1')!.textContent).toBe('Công ty');
    expect(main.textContent).toContain('Những đội kỹ thuật có bài viết được kể lại ở đây');
    const cards = [...main.querySelectorAll('li')];
    expect(cards).toHaveLength(3);
    expect(cards.map((c) => c.querySelector('h2')!.textContent)).toEqual(['Discord', 'Cloudflare', 'Netflix']);
  });

  it('makes the name the only internal link, stretched over the card', async () => {
    const { host } = await renderIndex(site(SITE));
    for (const li of host.querySelectorAll('main li')) {
      expect(li.className.split(' ')).toContain('relative');
      expect(li.className.split(' ')).toContain('panel');
      const internal = [...li.querySelectorAll('a')].filter((a) => a.getAttribute('href')!.startsWith('/'));
      expect(internal).toHaveLength(1);
      const cls = internal[0].className.split(' ');
      expect(cls).toContain('after:absolute');
      expect(cls).toContain('after:inset-0');
      expect(internal[0].closest('h2')).not.toBeNull();
    }
    const first = host.querySelector('main li a[href^="/"]')!;
    expect(first.getAttribute('href')).toBe('/vi/companies/discord');
  });

  it('puts the blog link outside the name link, above the stretch, opening safely', async () => {
    const { html, host } = await renderIndex(site(SITE));
    expect(host.querySelectorAll('a a')).toHaveLength(0);
    expect(html).not.toMatch(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<a\b/);
    const li = host.querySelector('main li')!;
    const blog = li.querySelector('a[href="https://discord.com/blog"]')!;
    expect(blog.textContent).toBe('Blog kỹ thuật');
    expect(blog.getAttribute('rel')).toBe('noopener noreferrer');
    expect(blog.getAttribute('target')).toBe('_blank');
    expect(blog.className.split(' ')).toEqual(expect.arrayContaining(['relative', 'z-10']));
  });

  it('shows counts with plural forms and the brand colour on the monogram letter only', async () => {
    const s = site(SITE);
    const vi_ = (await renderIndex(s)).host;
    const viCards = [...vi_.querySelectorAll('main li')];
    expect(viCards[0].textContent).toContain('2 bài');
    expect(viCards[2].textContent).toContain('1 bài');
    const mark = viCards[0].querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(mark.textContent).toBe('D');
    expect(mark.style.color).toBe('rgb(88, 101, 242)');
    expect(viCards[0].innerHTML.match(/#5865F2|rgb\(88, ?101, ?242\)/gi)).toHaveLength(1);
    const en = [...(await renderIndex(s, 'en')).host.querySelectorAll('main li')];
    expect(en[0].textContent).toContain('2 posts');
    expect(en[1].textContent).toContain('1 post');
    expect(en[1].textContent).not.toContain('1 posts');
    expect(en[2].textContent).toContain('0 posts');
  });

  it('exports metadata via buildMetadata', async () => {
    stub(site(SITE));
    const { generateMetadata } = await import('@/app/[locale]/companies/page');
    const m = await generateMetadata({ params: Promise.resolve({ locale: 'vi' }) });
    expect(m.title).toBe('Công ty · Hệ thống lớn');
    expect(m.description).toMatch(/^Những đội kỹ thuật/);
    expect(m.alternates?.canonical).toBe('/vi/companies');
    expect(m.openGraph).toMatchObject({ locale: 'vi_VN', url: '/vi/companies' });
    const en = await generateMetadata({ params: Promise.resolve({ locale: 'en' }) });
    expect(en.title).toBe('Companies · Hệ thống lớn');
  });
});

describe('company page', () => {
  it('renders the intro with name and count, the blog link, and the posts under an h2', async () => {
    const { host } = await renderCompany(site(SITE), 'vi', 'discord');
    const main = host.querySelector('main#content')!;
    expect(main.querySelector('h1')!.textContent).toBe('Discord');
    expect(main.querySelector('main header p')!.textContent).toBe('2 bài');
    const blog = main.querySelector('a[href="https://discord.com/blog"]')!;
    expect(blog.getAttribute('rel')).toBe('noopener noreferrer');
    const h2 = main.querySelector('h2')!;
    expect(h2.textContent).toBe('Bài viết');
    const hrefs = [...main.querySelectorAll('a[href^="/vi/posts/"]')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/vi/posts/d1', '/vi/posts/d2']);
    expect(host.querySelector('h1')!.outerHTML).not.toMatch(/style=/);
  });

  it('Review Focus 1: the en page of a company with only vi posts shows the English empty state', async () => {
    const s = site(SITE);
    const en = await renderCompany(s, 'en', 'netflix');
    expect(en.host.querySelector('h1')!.textContent).toBe('Netflix');
    expect(en.html).toContain('No posts from this company yet.');
    expect(en.host.querySelectorAll('a[href^="/en/posts/"]')).toHaveLength(0);
    expect(en.host.querySelector('main header p')!.textContent).toBe('0 posts');
    const vi_ = await renderCompany(s, 'vi', 'netflix');
    expect(vi_.host.querySelectorAll('a[href="/vi/posts/n1"]')).toHaveLength(1);
    expect(vi_.html).not.toContain('Chưa có bài nào về công ty này.');
  });

  it('404s for an unknown company or locale', async () => {
    stub(site(SITE));
    const { default: Page } = await import('@/app/[locale]/companies/[company]/page');
    await expect(Page({ params: Promise.resolve({ locale: 'vi', company: 'nope' }) })).rejects.toMatchObject({
      digest: expect.stringContaining('404'),
    });
    await expect(Page({ params: Promise.resolve({ locale: 'fr', company: 'discord' }) })).rejects.toMatchObject({
      digest: expect.stringContaining('404'),
    });
  });

  it('is static: every vocab company in both locales, nothing else', async () => {
    stub(site(SITE));
    const mod = await import('@/app/[locale]/companies/[company]/page');
    expect(mod.dynamicParams).toBe(false);
    const params = mod.generateStaticParams();
    expect(params).toHaveLength(6);
    expect(params).toContainEqual({ locale: 'en', company: 'netflix' });
    expect(params).toContainEqual({ locale: 'vi', company: 'discord' });
  });

  it('exports metadata via buildMetadata', async () => {
    stub(site(SITE));
    const { generateMetadata } = await import('@/app/[locale]/companies/[company]/page');
    const m = await generateMetadata({ params: Promise.resolve({ locale: 'en', company: 'discord' }) });
    expect(m.title).toBe('Discord · Hệ thống lớn');
    expect(m.description).toBe('Discord: 2 posts');
    expect(m.alternates).toEqual({
      canonical: '/en/companies/discord',
      languages: { vi: '/vi/companies/discord', en: '/en/companies/discord', 'x-default': '/vi/companies/discord' },
    });
    expect(await generateMetadata({ params: Promise.resolve({ locale: 'en', company: 'nope' }) })).toEqual({});
  });
});
