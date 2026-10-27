// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
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

afterEach(() => {
  vi.resetModules();
  window.history.pushState({}, '', '/');
});

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
    expect([...vi1.querySelectorAll('main#content a')].map((a) => a.getAttribute('lang'))).toEqual(['vi', 'en', 'vi']);
  });
  it('marks no nav item current on the real 404 even when the router path is a nav section', async () => {
    const { doc } = await render('/vi/companies/nope');
    expect(doc.querySelectorAll('header nav a[aria-current="page"]')).toHaveLength(0);
  });
  it('exports the vi title with the site name as metadata', async () => {
    const { metadata } = await import('@/app/not-found');
    expect(metadata.title).toBe(`${vi_.notFound.title} · ${vi_.site.name}`);
  });
  it('server-renders vi even when the browser URL is /en/... (the prerender sees /_not-found)', async () => {
    const { doc } = await render('/_not-found');
    expect(doc.querySelector('main#content h1')!.textContent).toBe(vi_.notFound.title);
  });
  it('hydrates an en URL without a recoverable error, then shows en and sets the title', async () => {
    state.pathname = '/_not-found';
    const { NotFoundBody } = await import('@/components/not-found-body');
    const el = <NotFoundBody vi={vi_.notFound} en={en_.notFound} siteNameEn={en_.site.name} />;
    const container = document.createElement('div');
    container.innerHTML = renderToString(el);
    document.body.appendChild(container);
    expect(container.querySelector('h1')!.textContent).toBe(vi_.notFound.title);
    window.history.pushState({}, '', '/en/nope');
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const onRecoverableError = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    let root!: ReturnType<typeof hydrateRoot>;
    try {
      await act(async () => {
        root = hydrateRoot(container, el, { onRecoverableError });
      });
      expect(consoleError).not.toHaveBeenCalled();
      expect(onRecoverableError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
    expect(container.querySelector('h1')!.textContent).toBe(en_.notFound.title);
    expect(document.title).toBe(`${en_.notFound.title} · ${en_.site.name}`);
    expect(container.querySelector('div')!.getAttribute('lang')).toBe('en');
    await act(async () => root.unmount());
    container.remove();
  });
  it('shows the en strings once the client URL is /en/...', async () => {
    window.history.pushState({}, '', '/en/does-not-exist');
    const { NotFoundBody } = await import('@/components/not-found-body');
    state.pathname = '/_not-found';
    const tree = document.createElement('div');
    document.body.appendChild(tree);
    const { createRoot } = await import('react-dom/client');
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const root = createRoot(tree);
    await act(async () => root.render(<NotFoundBody vi={vi_.notFound} en={en_.notFound} siteNameEn={en_.site.name} />));
    expect(tree.querySelector('h1')!.textContent).toBe(en_.notFound.title);
    expect(tree.textContent).toContain(en_.notFound.body);
    await act(async () => root.unmount());
  });
  it('falls back to vi for an unlocalized path', async () => {
    const { doc } = await render('/whatever');
    expect(doc.querySelector('main#content h1')!.textContent).toBe(vi_.notFound.title);
  });
  it('links to both locale homes with their own labels', async () => {
    const { doc } = await render('/_not-found');
    const links = [...doc.querySelectorAll('main#content a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/vi', '/en', '/vi/search']);
    expect(links.map((a) => a.textContent)).toEqual([vi_.notFound.home, en_.notFound.home, vi_.notFound.search]);
    const rows = [...doc.querySelectorAll('main#content p')].filter((p) => p.querySelector('a'));
    expect([...rows[0].querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['/vi', '/en']);
    expect([...rows[1].querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['/vi/search']);
    for (const a of links) {
      for (const c of ['text-[15px]', 'leading-[1.55]', 'text-ink', 'underline', 'decoration-hairline-strong', 'underline-offset-4', 'hover:decoration-accent']) {
        expect(a.className.split(' ')).toContain(c);
      }
      expect(a.className).not.toContain('mono-label');
    }
  });
});
