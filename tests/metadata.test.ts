import { describe, it, expect } from 'vitest';
import { buildMetadata } from '@/lib/metadata';
import { SITE_URL } from '@/lib/site';

describe('buildMetadata', () => {
  it('builds canonical, languages and openGraph', () => {
    const m = buildMetadata({ locale: 'vi', path: '/posts/x', title: 'T', description: 'D' });
    expect(m.metadataBase).toEqual(new URL(SITE_URL));
    expect(m.title).toBe('T');
    expect(m.description).toBe('D');
    expect(m.alternates).toEqual({
      canonical: '/vi/posts/x',
      languages: { vi: '/vi/posts/x', en: '/en/posts/x', 'x-default': '/vi/posts/x' },
    });
    expect(m.openGraph).toMatchObject({ locale: 'vi_VN', title: 'T', description: 'D', url: '/vi/posts/x', type: 'website' });
  });
  it('handles home path and en locale and type', () => {
    const m = buildMetadata({ locale: 'en', path: '', title: 'T', description: 'D', type: 'article' });
    expect(m.alternates?.canonical).toBe('/en');
    expect(m.alternates?.languages).toMatchObject({ vi: '/vi', 'x-default': '/vi' });
    expect(m.openGraph).toMatchObject({ locale: 'en_GB', url: '/en', type: 'article' });
  });

  it("normalises '/' to the home path", () => {
    const m = buildMetadata({ locale: 'vi', path: '/', title: 'T', description: 'D' });
    expect(m.alternates?.canonical).toBe('/vi');
    expect(m.openGraph).toMatchObject({ url: '/vi' });
  });

  it('filters languages by locales and drops x-default without vi', () => {
    const m = buildMetadata({ locale: 'en', path: '/x', title: 'T', description: 'D', locales: ['en'] });
    expect(m.alternates?.languages).toEqual({ en: '/en/x' });
    const both = buildMetadata({ locale: 'vi', path: '/x', title: 'T', description: 'D', locales: ['vi'] });
    expect(both.alternates?.languages).toEqual({ vi: '/vi/x', 'x-default': '/vi/x' });
  });
});
