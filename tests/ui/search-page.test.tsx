// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/vi/search',
}));

async function mod() {
  return import('@/app/[locale]/search/page');
}

describe('search page', () => {
  it('renders the intro and the search box inside main#content', async () => {
    const { default: Page } = await mod();
    const host = document.createElement('div');
    host.innerHTML = renderToStaticMarkup(await Page({ params: Promise.resolve({ locale: 'vi' }) }));
    const main = host.querySelector('main#content')!;
    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(main.querySelector('h1')!.textContent).toBe('Tìm kiếm');
    expect(main.querySelector('[data-search-state]')).not.toBeNull();
    expect(main.querySelector('input')).not.toBeNull();
  });
  it('holds the intro and box in a 720px measure and lists every vocab topic, linking only non-empty ones', async () => {
    const { default: Page } = await mod();
    const { loadVocab } = await import('@/lib/content/vocab');
    const { listPosts } = await import('@/lib/content/load');
    const { topicsWithCounts } = await import('@/lib/content/index');
    const vocab = loadVocab();
    const counts = topicsWithCounts(listPosts(), vocab, 'vi');
    const host = document.createElement('div');
    host.innerHTML = renderToStaticMarkup(await Page({ params: Promise.resolve({ locale: 'vi' }) }));
    const measure = host.querySelector('main#content > div')!;
    expect(measure.className).toContain('max-w-[720px]');
    expect(measure.querySelector('h1')).not.toBeNull();
    expect(measure.querySelector('input')).not.toBeNull();
    const items = [...measure.querySelectorAll('[data-search-browse] li')];
    expect(items).toHaveLength(vocab.topics.length);
    counts.forEach(({ topic, count }, i) => {
      const a = items[i].querySelector('a');
      if (count > 0) expect(a!.getAttribute('href')).toBe(`/vi/topics/${topic.slug}`);
      else expect(a).toBeNull();
      expect(items[i].textContent).toContain(topic.vi);
    });
    expect(measure.textContent).toContain('Hoặc duyệt theo chủ đề:');
  });
  it('marks the search nav link current on /vi/search', async () => {
    const { default: Page } = await mod();
    const host = document.createElement('div');
    host.innerHTML = renderToStaticMarkup(await Page({ params: Promise.resolve({ locale: 'vi' }) }));
    const cur = [...host.querySelectorAll('nav a[aria-current="page"]')].map((a) => a.getAttribute('href'));
    expect(cur).toEqual(['/vi/search']);
  });
  it('is noindex,follow with the canonical /vi/search', async () => {
    const { generateMetadata } = await mod();
    const m = await generateMetadata({ params: Promise.resolve({ locale: 'vi' }) });
    expect(m.robots).toEqual({ index: false, follow: true });
    expect(m.alternates?.canonical).toBe('/vi/search');
    expect(m.alternates?.languages).toEqual({ vi: '/vi/search', en: '/en/search', 'x-default': '/vi/search' });
  });
  it('is static over both locales', async () => {
    const { generateStaticParams, dynamicParams } = await mod();
    expect(generateStaticParams()).toEqual([{ locale: 'vi' }, { locale: 'en' }]);
    expect(dynamicParams).toBe(false);
  });
});
