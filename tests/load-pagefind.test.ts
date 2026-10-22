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
    const first = load();
    await expect(first).resolves.toBeNull();
    const second = load();
    expect(second).not.toBe(first);
    await expect(second).resolves.toBeNull();
  });

  it('rejects in production so the box can show an error, and retries', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const load = await fresh();
    const first = load();
    await expect(first).rejects.toBeDefined();
    const second = load();
    expect(second).not.toBe(first);
    await expect(second).rejects.toBeDefined();
  });
});
