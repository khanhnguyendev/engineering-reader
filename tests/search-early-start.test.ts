import { afterEach, describe, expect, it, vi } from 'vitest';
import { EARLY_KEY, earlyStartScript } from '@/lib/search-preload';

/** Runs the inline script against a fake page; `import` is swapped for a stub since the script calls it directly. */
function runScript(search: string, pf: object | Error) {
  const win: Record<string, unknown> = {};
  const importer = vi.fn(() => (pf instanceof Error ? Promise.reject(pf) : Promise.resolve(pf)));
  const code = earlyStartScript(2).replace('import(', '__import(');
  new Function('location', 'window', 'URLSearchParams', '__import', code)({ search }, win, URLSearchParams, importer);
  return { win, importer };
}

describe('earlyStartScript', () => {
  it('starts and inits pagefind for a deep link', async () => {
    const pf = { init: vi.fn().mockResolvedValue(undefined) };
    const { win, importer } = runScript('?q=du%20lieu', pf);
    expect(importer).toHaveBeenCalledWith('/pagefind/pagefind.js');
    await expect(win[EARLY_KEY]).resolves.toBe(pf);
    expect(pf.init).toHaveBeenCalledTimes(1);
  });

  it.each(['', '?q=', '?q=a', '?q=%20%20', '?x=1'])('does nothing for %j', (search) => {
    const { win, importer } = runScript(search, {});
    expect(importer).not.toHaveBeenCalled();
    expect(win[EARLY_KEY]).toBeUndefined();
  });

  it('resolves null when the runtime cannot load', async () => {
    const { win } = runScript('?q=abc', new Error('404'));
    await expect(win[EARLY_KEY]).resolves.toBeNull();
  });
});

describe('loadPagefind with an early start', () => {
  afterEach(() => {
    vi.doUnmock('/pagefind/pagefind.js');
    delete (globalThis as Record<string, unknown>)[EARLY_KEY];
  });

  async function fresh() {
    vi.resetModules();
    return (await import('@/components/search/load-pagefind')).loadPagefind;
  }

  it('uses the early instance once, without importing or initing again', async () => {
    const early = { init: vi.fn(), destroy: vi.fn().mockResolvedValue(undefined), search: vi.fn() };
    const fallback = { init: vi.fn().mockResolvedValue(undefined), destroy: vi.fn(), search: vi.fn() };
    vi.doMock('/pagefind/pagefind.js', () => fallback);
    (globalThis as Record<string, unknown>)[EARLY_KEY] = Promise.resolve(early);
    const load = await fresh();
    await expect(load('vi')).resolves.toBe(early);
    expect(early.init).not.toHaveBeenCalled();
    expect(fallback.init).not.toHaveBeenCalled();
    expect((globalThis as Record<string, unknown>)[EARLY_KEY]).toBeUndefined();
  });

  it('falls back to the normal load when the early start failed', async () => {
    const fallback = { init: vi.fn().mockResolvedValue(undefined), destroy: vi.fn(), search: vi.fn() };
    vi.doMock('/pagefind/pagefind.js', () => fallback);
    (globalThis as Record<string, unknown>)[EARLY_KEY] = Promise.resolve(null);
    const load = await fresh();
    await load('vi');
    expect(fallback.init).toHaveBeenCalledTimes(1);
  });
});
