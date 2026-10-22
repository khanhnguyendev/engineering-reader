// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import vi_ from '@/dictionaries/vi.json';
import en_ from '@/dictionaries/en.json';

vi.mock('server-only', () => ({}));
vi.mock('next/font/google', () => ({
  Inter: () => ({ variable: 'inter-var', className: 'inter' }),
  JetBrains_Mono: () => ({ variable: 'jb-var', className: 'jb' }),
}));
const state = { pathname: '/vi/does-not-exist' };
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => state.pathname,
}));

afterEach(() => vi.resetModules());

async function render(pathname: string) {
  state.pathname = pathname;
  const { default: NotFound } = await import('@/app/not-found');
  const doc = document.implementation.createHTMLDocument('');
  const html = renderToStaticMarkup(NotFound());
  doc.documentElement.innerHTML = html.replace(/^<html[^>]*>|<\/html>$/g, '');
  return { doc, html };
}

describe('root not-found', () => {
  it('shows the vi strings for /vi/...', async () => {
    const { doc, html } = await render('/vi/does-not-exist');
    expect(html.startsWith('<html lang="vi"')).toBe(true);
    expect(doc.querySelector('main#content h1')!.textContent).toBe(vi_.notFound.title);
    expect(doc.querySelector('main#content')!.textContent).toContain(vi_.notFound.body);
    expect(doc.querySelector('header')).not.toBeNull();
    expect(html).toContain('inter-var jb-var');
    expect(html).toMatch(/<script>[^<]*dataset\.theme/);
  });
  it('marks the language of the wrapper and of each home link', async () => {
    const vi1 = (await render('/vi/x')).doc;
    expect(vi1.querySelector('main#content > div')!.getAttribute('lang')).toBe('vi');
    const en1 = (await render('/en/x')).doc;
    expect(en1.querySelector('main#content > div')!.getAttribute('lang')).toBe('en');
    expect([...en1.querySelectorAll('main#content a')].map((a) => a.getAttribute('lang'))).toEqual(['vi', 'en']);
  });
  it('exports the vi title as metadata', async () => {
    const { metadata } = await import('@/app/not-found');
    expect(metadata.title).toBe(vi_.notFound.title);
  });
  it('shows the en strings for /en/...', async () => {
    const { doc } = await render('/en/does-not-exist');
    expect(doc.querySelector('main#content h1')!.textContent).toBe(en_.notFound.title);
    expect(doc.querySelector('main#content')!.textContent).toContain(en_.notFound.body);
  });
  it('falls back to vi for an unlocalized path', async () => {
    const { doc } = await render('/whatever');
    expect(doc.querySelector('main#content h1')!.textContent).toBe(vi_.notFound.title);
  });
  it('links to both locale homes with their own labels', async () => {
    const { doc } = await render('/en/x');
    const links = [...doc.querySelectorAll('main#content a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/vi', '/en']);
    expect(links.map((a) => a.textContent)).toEqual([vi_.notFound.home, en_.notFound.home]);
  });
});
