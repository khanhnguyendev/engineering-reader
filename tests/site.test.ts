import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => vi.unstubAllEnvs());

describe('SITE_URL', () => {
  it('strips trailing slashes from NEXT_PUBLIC_SITE_URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.test///');
    vi.resetModules();
    expect((await import('@/lib/site')).SITE_URL).toBe('https://example.test');
  });

  it('leaves a clean URL untouched', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.test');
    vi.resetModules();
    expect((await import('@/lib/site')).SITE_URL).toBe('https://example.test');
  });
});
