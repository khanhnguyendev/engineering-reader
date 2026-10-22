// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Header } from '@/components/header';

vi.mock('server-only', () => ({}));
const state = { pathname: '/vi/companies/discord' };
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => state.pathname,
}));

function current(pathname: string, locale: 'vi' | 'en' = 'vi') {
  state.pathname = pathname;
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(<Header locale={locale} />);
  return [...host.querySelectorAll('nav a[aria-current="page"]')].map((a) => a.getAttribute('href'));
}

describe('header nav state', () => {
  it('marks companies on a company page only', () => {
    expect(current('/vi/companies/discord')).toEqual(['/vi/companies']);
  });
  it('does not mark a section under the other locale', () => {
    expect(current('/en/companies/nope', 'vi')).toEqual([]);
  });
  it('gives text-ink only to the active link', () => {
    state.pathname = '/vi/companies/discord';
    const host = document.createElement('div');
    host.innerHTML = renderToStaticMarkup(<Header locale="vi" />);
    const links = [...host.querySelectorAll('nav a')];
    expect(links.length).toBeGreaterThan(1);
    for (const a of links) {
      const active = a.getAttribute('aria-current') === 'page';
      expect(a.className.split(' ').includes('text-ink')).toBe(active);
    }
  });
  it('marks topics and about', () => {
    expect(current('/vi/topics')).toEqual(['/vi/topics']);
    expect(current('/en/about', 'en')).toEqual(['/en/about']);
  });
  it('marks nothing on tags, series, posts and home', () => {
    for (const p of ['/vi/tags/x', '/vi/series/s', '/vi/posts/p', '/vi']) expect(current(p)).toEqual([]);
  });
});
