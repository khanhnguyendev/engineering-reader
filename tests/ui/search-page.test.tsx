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
