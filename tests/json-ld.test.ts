// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { articleJsonLd } from '@/lib/json-ld';
import { JsonLd } from '@/components/post/json-ld';
import type { PostRecord } from '@/lib/content/load';
import type { Vocab } from '@/lib/content/vocab';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LD = Record<string, any>;
const SITE = 'https://example.test';
const vocab = {
  companies: [{ slug: 'discord', name: 'Discord' }],
  topics: [],
  tags: [
    { slug: 'cassandra', vi: 'Cassandra', en: 'Cassandra' },
    { slug: 'hot-partition', vi: 'Phân vùng nóng', en: 'Hot partition' },
  ],
  series: {},
  sourceHosts: [],
  featured: [],
} as unknown as Vocab;
const dict = { site: { name: 'Hệ thống lớn' } };

const sources = [
  { id: 'S1', type: 'blog', title: 'First', authors: ['Bo Ingram', 'A B'], publishedAt: '2023-03-06', url: 'https://a.test/1', accessedAt: '2026-10-21', locator: null },
  { id: 'S2', type: 'blog', title: 'Second', authors: [], publishedAt: '2024-01-01', url: 'https://a.test/2', accessedAt: '2026-10-21', locator: null },
];

function post(over: { title?: string; summary?: string; updatedAt?: string | null } = {}): PostRecord {
  const doc = (t: string) => ({ frontmatter: { title: over.title ?? t, summary: over.summary ?? 'A summary' } });
  return {
    slug: 'p1',
    dir: 'p1',
    meta: {
      slug: 'p1',
      company: 'discord',
      topic: 'data',
      tags: ['cassandra', 'hot-partition'],
      publishedAt: '2026-10-21',
      updatedAt: over.updatedAt ?? null,
      sources,
    },
    locales: { vi: doc('Tiêu đề'), en: doc('Title') },
  } as unknown as PostRecord;
}

describe('articleJsonLd', () => {
  const ld = articleJsonLd(post(), 'vi', vocab, dict, SITE) as LD;

  it('is a schema.org Article in the locale', () => {
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Article');
    expect(ld.inLanguage).toBe('vi');
    expect(ld.headline).toBe('Tiêu đề');
    expect(ld.description).toBe('A summary');
    expect(ld.mainEntityOfPage).toBe(`${SITE}/vi/posts/p1`);
    expect(ld.about).toBe('Discord');
    expect(ld.keywords).toEqual(['Cassandra', 'Phân vùng nóng']);
  });

  it('uses the locale for language and keywords', () => {
    const en = articleJsonLd(post(), 'en', vocab, dict, SITE) as LD;
    expect(en.inLanguage).toBe('en');
    expect(en.keywords).toEqual(['Cassandra', 'Hot partition']);
    expect(en.image[0]).toBe(`${SITE}/og/en/p1.png`);
  });

  it('has an absolute image, author and publisher', () => {
    expect(ld.image).toEqual([`${SITE}/og/vi/p1.png`]);
    expect(ld.author).toEqual({ '@type': 'Person', name: 'Ryan', url: `${SITE}/vi/about` });
    expect(ld.publisher).toEqual({ '@type': 'Organization', name: 'Hệ thống lớn', url: SITE });
  });

  it('dates: dateModified falls back to publishedAt', () => {
    expect(ld.datePublished).toBe('2026-10-21');
    expect(ld.dateModified).toBe('2026-10-21');
    const upd = articleJsonLd(post({ updatedAt: '2026-11-02' }), 'vi', vocab, dict, SITE) as LD;
    expect(upd.dateModified).toBe('2026-11-02');
  });

  it('cites every source with its URL and authors', () => {
    expect(ld.citation).toHaveLength(sources.length);
    expect(ld.citation.map((c: { url: string }) => c.url)).toEqual(sources.map((s) => s.url));
    expect(ld.citation[0]).toEqual({
      '@type': 'CreativeWork',
      name: 'First',
      url: 'https://a.test/1',
      author: [{ '@type': 'Person', name: 'Bo Ingram' }, { '@type': 'Person', name: 'A B' }],
      datePublished: '2023-03-06',
    });
  });

  it('trims a 120-character title to at most 110 characters with an ellipsis', () => {
    const long = articleJsonLd(post({ title: 'x'.repeat(120) }), 'vi', vocab, dict, SITE) as LD;
    expect(long.headline.length).toBeLessThanOrEqual(110);
    expect(long.headline.endsWith('…')).toBe(true);
    const exact = articleJsonLd(post({ title: 'y'.repeat(110) }), 'vi', vocab, dict, SITE) as LD;
    expect(exact.headline).toBe('y'.repeat(110));
  });
});

describe('headline trim by code points', () => {
  it('keeps at most 110 code points for a Vietnamese title', () => {
    const h = (articleJsonLd(post({ title: 'ế'.repeat(120) }), 'vi', vocab, dict, SITE) as LD).headline as string;
    expect(Array.from(h).length).toBeLessThanOrEqual(110);
    expect(h.endsWith('…')).toBe(true);
  });
  it('never leaves a lone surrogate when an emoji sits at the cut', () => {
    const title = `${'a'.repeat(108)}😀${'b'.repeat(20)}`;
    const h = (articleJsonLd(post({ title }), 'vi', vocab, dict, SITE) as LD).headline as string;
    expect(h).toBe(`${'a'.repeat(108)}😀…`);
    expect(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(h)).toBe(false);
  });
});

describe('JsonLd', () => {
  it('cannot be terminated early by </script> in the data', () => {
    const data = articleJsonLd(post({ summary: '</script><script>alert(1)</script>' }), 'vi', vocab, dict, SITE);
    const html = renderToStaticMarkup(JsonLd({ data }));
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const scripts = doc.querySelectorAll('script');
    expect(scripts).toHaveLength(1);
    expect(scripts[0].getAttribute('type')).toBe('application/ld+json');
    expect(JSON.parse(scripts[0].textContent!)).toEqual(data);
    expect(html).not.toContain('</script><script>');
  });

  it('does not emit an HTML comment opener from the data', () => {
    const data = articleJsonLd(post({ summary: '<!-- <script>' }), 'vi', vocab, dict, SITE);
    const html = renderToStaticMarkup(JsonLd({ data }));
    expect(html).not.toContain('<!--');
    expect(JSON.parse(new DOMParser().parseFromString(html, 'text/html').querySelector('script')!.textContent!)).toEqual(data);
  });
});
