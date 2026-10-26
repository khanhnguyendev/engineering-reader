import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => vi.unstubAllEnvs());

async function fresh() {
  vi.resetModules();
  return (await import('@/components/search/load-pagefind')).loadPagefind;
}

describe('loadPagefind when the index is missing', () => {
  it('resolves null outside production and retries on the next call', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const load = await fresh();
    const first = load('vi');
    await expect(first).resolves.toBeNull();
    const second = load('vi');
    expect(second).not.toBe(first);
    await expect(second).resolves.toBeNull();
  });

  it('rejects in production so the box can show an error, and retries', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const load = await fresh();
    const first = load('vi');
    await expect(first).rejects.toBeDefined();
    const second = load('vi');
    expect(second).not.toBe(first);
    await expect(second).rejects.toBeDefined();
  });
});

describe('loadPagefind per locale', () => {
  function stub() {
    const pf = { init: vi.fn().mockResolvedValue(undefined), destroy: vi.fn().mockResolvedValue(undefined), search: vi.fn() };
    vi.doMock('/pagefind/pagefind.js', () => pf);
    return pf;
  }
  afterEach(() => vi.doUnmock('/pagefind/pagefind.js'));

  it('does not re-init on repeated calls in the same locale', async () => {
    const pf = stub();
    const load = await fresh();
    const a = load('vi');
    const b = load('vi');
    expect(b).toBe(a);
    await a;
    await load('vi');
    expect(pf.init).toHaveBeenCalledTimes(1);
    expect(pf.destroy).not.toHaveBeenCalled();
  });

  it('destroys and re-inits when the locale changes, then memoizes the new locale', async () => {
    const pf = stub();
    const load = await fresh();
    await load('vi');
    const en = load('en');
    await en;
    expect(pf.destroy).toHaveBeenCalledTimes(1);
    expect(pf.init).toHaveBeenCalledTimes(2);
    expect(pf.destroy.mock.invocationCallOrder[0]).toBeLessThan(pf.init.mock.invocationCallOrder[1]);
    expect(load('en')).toBe(en);
    await load('en');
    expect(pf.init).toHaveBeenCalledTimes(2);
    await load('vi');
    expect(pf.destroy).toHaveBeenCalledTimes(2);
    expect(pf.init).toHaveBeenCalledTimes(3);
  });
});
