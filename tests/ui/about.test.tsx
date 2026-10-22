// @vitest-environment jsdom
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/vi/about',
}));

const tmp = mkdtempSync(path.join(tmpdir(), 'about-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));
afterEach(() => vi.unstubAllEnvs());

const BODY = {
  vi: '## Nguồn\n\nMọi con số có tham chiếu như `[S1 §3]`, và [S1] này là chữ thường.\n\n## Cách làm\n\nĐoạn hai.\n',
  en: '## Sources\n\nEvery number has a reference like `[S1 §3]`, and this [S1] is plain text.\n\n## How\n\nSecond paragraph.\n',
};

/** A temp site: the about page reads `<CONTENT_ROOT>/../pages`, so no vocab and no posts are needed. */
function stub() {
  const root = mkdtempSync(path.join(tmp, 's-'));
  mkdirSync(path.join(root, 'posts'));
  mkdirSync(path.join(root, 'pages'));
  writeFileSync(path.join(root, 'pages', 'about.vi.mdx'), BODY.vi);
  writeFileSync(path.join(root, 'pages', 'about.en.mdx'), BODY.en);
  vi.resetModules();
  vi.stubEnv('CONTENT_ROOT', path.join(root, 'posts'));
}

async function render(locale: string) {
  stub();
  const { default: Page } = await import('@/app/[locale]/about/page');
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(await Page({ params: Promise.resolve({ locale }) }));
  return host;
}

describe('about page', () => {
  it('renders the vi page: intro, one panel section per H2, then the byline', async () => {
    const host = await render('vi');
    const main = host.querySelector('main#content')!;
    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(main.querySelector('h1')!.textContent).toBe('Giới thiệu');
    expect(main.textContent).toContain('Ai viết trang này');
    const sections = [...main.querySelectorAll('section.panel')];
    expect(sections.map((s) => s.querySelector('h2')!.textContent)).toEqual(['Nguồn', 'Cách làm']);
    expect(main.textContent).toContain('Biên tập: Ryan');
    expect(host.innerHTML.indexOf('Đoạn hai')).toBeLessThan(host.innerHTML.indexOf('Biên tập: Ryan'));
  });

  it('renders the en page with English chrome and body', async () => {
    const host = await render('en');
    expect(host.querySelector('h1')!.textContent).toBe('About');
    expect([...host.querySelectorAll('main section h2')].map((h) => h.textContent)).toEqual(['Sources', 'How']);
    expect(host.querySelector('footer')!.textContent).toContain('Ryan');
    expect(host.innerHTML).not.toContain('Giới thiệu');
  });

  it('localizes the section anchors and renders the RSS line outside the last section', async () => {
    const vi_ = await render('vi');
    const labels = [...vi_.querySelectorAll('a.h2-anchor')].map((a) => a.getAttribute('aria-label'));
    expect(labels).toEqual(['Liên kết đến mục này', 'Liên kết đến mục này']);
    expect(vi_.innerHTML).not.toContain('Link to this section');
    const rss = [...vi_.querySelectorAll('main p')].find((p) => p.querySelector('a[href="/vi/feed.xml"]'))!;
    expect(rss.closest('section')).toBeNull();
    expect(rss.textContent).toBe('Theo dõi bài mới qua RSS: Nguồn RSS tiếng Việt');
    const en = await render('en');
    const enRss = [...en.querySelectorAll('main p')].find((p) => p.querySelector('a[href="/en/feed.xml"]'))!;
    expect(enRss.closest('section')).toBeNull();
    expect(enRss.textContent).toBe('Follow new posts by RSS: English RSS feed');
    expect(en.querySelector('a.h2-anchor')!.getAttribute('aria-label')).toBe('Link to this section');
  });

  it('keeps [S1] as literal text: no ref plugin runs on pages', async () => {
    for (const locale of ['vi', 'en']) {
      const host = await render(locale);
      expect(host.innerHTML).not.toContain('href="#S1"');
      expect(host.querySelector('a.ref')).toBeNull();
      expect(host.querySelector('code')!.textContent).toBe('[S1 §3]');
      expect(host.querySelector('main')!.textContent).toContain('[S1]');
    }
  });

  it('404s for an unknown locale', async () => {
    stub();
    const { default: Page } = await import('@/app/[locale]/about/page');
    await expect(Page({ params: Promise.resolve({ locale: 'fr' }) })).rejects.toMatchObject({
      digest: expect.stringContaining('404'),
    });
  });

  it('exports metadata via buildMetadata', async () => {
    stub();
    const { generateMetadata } = await import('@/app/[locale]/about/page');
    const vi_ = await generateMetadata({ params: Promise.resolve({ locale: 'vi' }) });
    expect(vi_.title).toBe('Giới thiệu · Hệ thống lớn');
    expect(vi_.description).toMatch(/^Ai viết trang này/);
    expect(vi_.alternates).toMatchObject({
      canonical: '/vi/about',
      languages: { vi: '/vi/about', en: '/en/about', 'x-default': '/vi/about' },
    });
    expect(vi_.alternates?.languages).toEqual({ vi: '/vi/about', en: '/en/about', 'x-default': '/vi/about' });
    expect(vi_.openGraph).toMatchObject({ locale: 'vi_VN', url: '/vi/about' });
    const en = await generateMetadata({ params: Promise.resolve({ locale: 'en' }) });
    expect(en.title).toBe('About · Hệ thống lớn');
    expect(en.description).toMatch(/^Who writes this/);
    expect(en.openGraph).toMatchObject({ locale: 'en_GB', url: '/en/about' });
  });
});
