// @vitest-environment node
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { ReactElement, ReactNode } from 'react';

vi.mock('server-only', () => ({}));

const GOOD = 'tests/fixtures/posts/good-post';
const META = JSON.parse(readFileSync(path.join(GOOD, 'post.json'), 'utf8'));
const VOCAB_FILES = ['companies', 'topics', 'tags', 'series', 'source-hosts', 'featured'];
const COMPANIES = [
  { slug: 'discord', name: 'Discord', blogUrl: 'https://discord.com/blog', feedUrl: 'https://discord.com/blog/rss.xml', brandColor: '#5865F2', logo: 'public/logos/discord.svg' },
];

const tmp = mkdtempSync(path.join(tmpdir(), 'og-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));
afterEach(() => vi.unstubAllEnvs());

/** Temp content with `both` (vi+en) and `viOnly` (en draft) posts. */
function stub() {
  const postsDir = path.join(tmp, 'posts');
  const vocabDir = path.join(tmp, 'vocab');
  mkdirSync(postsDir, { recursive: true });
  mkdirSync(vocabDir, { recursive: true });
  for (const f of VOCAB_FILES) cpSync(`content/${f}.json`, path.join(vocabDir, `${f}.json`));
  writeFileSync(path.join(vocabDir, 'companies.json'), JSON.stringify(COMPANIES));
  for (const slug of ['both', 'vi-only']) {
    const dir = path.join(postsDir, slug);
    cpSync(GOOD, dir, { recursive: true });
    writeFileSync(path.join(dir, 'post.json'), JSON.stringify({ ...META, slug }));
    if (slug === 'vi-only') {
      const en = path.join(dir, 'en.mdx');
      writeFileSync(en, readFileSync(en, 'utf8').replace(/^---\n/, '---\ndraft: true\n'));
    }
  }
  vi.resetModules();
  vi.stubEnv('CONTENT_ROOT', postsDir);
  vi.stubEnv('VOCAB_ROOT', vocabDir);
}

/** Resolve function components, then collect every string in the tree. */
function texts(node: ReactNode): string[] {
  if (node == null || typeof node === 'boolean') return [];
  if (typeof node === 'string' || typeof node === 'number') return [String(node)];
  if (Array.isArray(node)) return node.flatMap(texts);
  const el = node as ReactElement<{ children?: ReactNode }>;
  if (typeof el.type === 'function') {
    return texts((el.type as (p: unknown) => ReactNode)(el.props));
  }
  return texts(el.props.children);
}

const POST = {
  kind: 'post' as const,
  title: 'Một data center ở Oregon',
  companyName: 'Cloudflare',
  brandColor: '#F38020',
  keyNumber: { value: '177 → 72', label: 'Số node' },
  tagline: 'Bài học từ hệ thống lớn, cho team nhỏ',
  siteName: 'Engineering Reader',
};

describe('mixHex', () => {
  it('keeps pct% of the first colour, the rest from the second with plain sRGB interpolation', async () => {
    const { mixHex } = await import('@/lib/og/card');
    expect(mixHex('#ffffff', '#000000', 70)).toBe('#b3b3b3');
    expect(mixHex('#5865F2', '#111827', 100)).toBe('#5865f2');
    expect(mixHex('#5865F2', '#111827', 0)).toBe('#111827');
    // #F38020 * .7 + #111827 * .3 = (175, 97, 34)
    expect(mixHex('#F38020', '#111827', 70)).toBe('#af6122');
  });
});

describe('OgCard', () => {
  it.each(['vi', 'en'] as const)('post card carries title, number, tagline on the light ground (%s)', async (locale) => {
    stub();
    const { OgCard } = await import('@/lib/og/card');
    const el = OgCard({ ...POST, locale });
    expect((el.props as { style: { backgroundColor: string } }).style.backgroundColor).toBe('#f2f4f3');
    const all = texts(el).join('|');
    expect(all).toContain('Một data center ở Oregon');
    expect(all).toContain('177 → 72');
    expect(all).toContain('Số node');
    expect(all).toContain('Cloudflare');
    expect(all).toContain('Bài học từ hệ thống lớn, cho team nhỏ');
  });

  it('site card has the site name and tagline and no key number', async () => {
    stub();
    const { OgCard } = await import('@/lib/og/card');
    const el = OgCard({ kind: 'site', locale: 'vi', title: '', tagline: POST.tagline, siteName: 'Engineering Reader' });
    expect((el.props as { style: { backgroundColor: string } }).style.backgroundColor).toBe('#f2f4f3');
    const all = texts(el).join('|');
    expect(all).toContain('Engineering Reader');
    expect(all).toContain(POST.tagline);
    expect(all).not.toContain('→');
  });
});

describe('loadOgFonts', () => {
  it('reads static TTFs from assets/og', async () => {
    const { loadOgFonts } = await import('@/lib/og/card');
    const fonts = loadOgFonts();
    expect(fonts.map((f) => `${f.name}:${f.weight}`).sort()).toEqual([
      'Inter:400', 'Inter:600', 'Inter:700', 'JetBrains Mono:700',
    ]);
    for (const f of fonts) expect(f.data.length).toBeGreaterThan(100_000);
  });
});

describe('og route', () => {
  it('generateStaticParams: site per locale, a post card only where the locale exists', async () => {
    stub();
    const { generateStaticParams } = await import('@/app/og/[locale]/[card]/route');
    const params = generateStaticParams();
    expect(params).toContainEqual({ locale: 'vi', card: 'site.png' });
    expect(params).toContainEqual({ locale: 'en', card: 'site.png' });
    expect(params).toContainEqual({ locale: 'vi', card: 'both.png' });
    expect(params).toContainEqual({ locale: 'en', card: 'both.png' });
    expect(params).toContainEqual({ locale: 'vi', card: 'vi-only.png' });
    expect(params).not.toContainEqual({ locale: 'en', card: 'vi-only.png' });
  });

  it('exports static-only flags', async () => {
    stub();
    const mod = await import('@/app/og/[locale]/[card]/route');
    expect(mod.dynamicParams).toBe(false);
    expect(mod.dynamic).toBe('force-static');
  });

  it.each([
    ['vi', 'site.png'],
    ['en', 'site.png'],
    ['vi', 'both.png'],
  ])('GET /og/%s/%s returns a PNG', async (locale, card) => {
    stub();
    const { GET } = await import('@/app/og/[locale]/[card]/route');
    const res = await GET(new Request('http://x'), { params: Promise.resolve({ locale, card }) });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    const buf = new Uint8Array(await res.arrayBuffer());
    expect([...buf.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }, 30_000);

  it('GET 404s for unknown slug, missing locale, bad locale and bad suffix', async () => {
    stub();
    const { GET } = await import('@/app/og/[locale]/[card]/route');
    for (const [locale, card] of [['vi', 'nope.png'], ['en', 'vi-only.png'], ['fr', 'site.png'], ['vi', 'both']]) {
      const res = await GET(new Request('http://x'), { params: Promise.resolve({ locale, card }) });
      expect(res.status).toBe(404);
    }
  });
});
