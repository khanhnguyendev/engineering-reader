import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { buildMetadata } from '@/lib/metadata';
import { SITE_URL } from '@/lib/site';

describe('buildMetadata', () => {
  it.each(['vi', 'en'] as const)('sets og:site_name from the dictionary (%s)', (locale) => {
    const m = buildMetadata({ locale, path: '/x', title: 'T', description: 'D' });
    expect(m.openGraph).toMatchObject({ siteName: 'Hệ thống lớn' });
  });

  it('builds canonical, languages and openGraph', () => {
    const m = buildMetadata({ locale: 'vi', path: '/posts/x', title: 'T', description: 'D' });
    expect(m.metadataBase).toEqual(new URL(SITE_URL));
    expect(m.title).toBe('T');
    expect(m.description).toBe('D');
    expect(m.alternates).toMatchObject({
      canonical: '/vi/posts/x',
      languages: { vi: '/vi/posts/x', en: '/en/posts/x', 'x-default': '/vi/posts/x' },
    });
    expect(m.alternates?.languages).toEqual({ vi: '/vi/posts/x', en: '/en/posts/x', 'x-default': '/vi/posts/x' });
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

  it('adds OG image, twitter card and rss alternate', () => {
    const m = buildMetadata({ locale: 'en', path: '/about', title: 'T', description: 'D' });
    expect(m.twitter).toMatchObject({ card: 'summary_large_image', title: 'T', description: 'D', images: ['/og/en/site.png'] });
    expect((m.openGraph as { images: unknown }).images).toEqual([{ url: '/og/en/site.png', width: 1200, height: 630, alt: 'T' }]);
    expect(m.alternates?.types).toEqual({ 'application/rss+xml': [{ url: '/en/feed.xml', title: 'Hệ thống lớn: new posts' }] });
  });
  it('uses a custom image and article times', () => {
    const m = buildMetadata({ locale: 'vi', path: '/posts/x', title: 'T', description: 'D', type: 'article', image: '/og/vi/x.png', publishedTime: '2026-10-01', modifiedTime: '2026-10-02' });
    expect(m.openGraph).toMatchObject({ publishedTime: '2026-10-01', modifiedTime: '2026-10-02', images: [{ url: '/og/vi/x.png' }] });
    expect(m.twitter).toMatchObject({ images: ['/og/vi/x.png'] });
    expect(m.alternates?.types).toEqual({ 'application/rss+xml': [{ url: '/vi/feed.xml', title: 'Hệ thống lớn: bài mới' }] });
  });
  it('omits times for websites', () => {
    const m = buildMetadata({ locale: 'vi', path: '/x', title: 'T', description: 'D', publishedTime: '2026-10-01' });
    expect(m.openGraph).not.toHaveProperty('publishedTime');
  });
  it('has no en and /vi x-default for locales [vi]; no x-default for [en]', () => {
    const vi_ = buildMetadata({ locale: 'vi', path: '/about', title: 'T', description: 'D', locales: ['vi'] });
    expect(vi_.alternates?.languages).toEqual({ vi: '/vi/about', 'x-default': '/vi/about' });
    const en = buildMetadata({ locale: 'en', path: '/about', title: 'T', description: 'D', locales: ['en'] });
    expect(en.alternates?.languages).toEqual({ en: '/en/about' });
  });

  it('adds a text/markdown alternate only when markdown is given', () => {
    const m = buildMetadata({ locale: 'vi', path: '/posts/x', title: 'T', description: 'D', markdown: '/vi/posts/x.md' });
    expect(m.alternates?.types?.['text/markdown']).toBe('/vi/posts/x.md');
    expect(m.alternates?.types?.['application/rss+xml']).toBeDefined();
    const n = buildMetadata({ locale: 'vi', path: '/posts/x', title: 'T', description: 'D' });
    expect(n.alternates?.types?.['text/markdown']).toBeUndefined();
  });
});
