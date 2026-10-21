// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { listPosts } from '@/lib/content/load';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/vi',
}));

const FIXTURE_ROOT = 'tests/fixtures/posts';
const FIXTURE = path.join(FIXTURE_ROOT, 'good-post');
const meta = JSON.parse(readFileSync(path.join(FIXTURE, 'post.json'), 'utf8'));
const GOOD_TITLE = 'Discord chuyển kho tin nhắn từ Cassandra sang ScyllaDB';

async function render(root: string, locale = 'vi') {
  vi.resetModules();
  vi.stubEnv('CONTENT_ROOT', root);
  const { default: Page } = await import('@/app/[locale]/page');
  return renderToStaticMarkup(await Page({ params: Promise.resolve({ locale }) }));
}

afterEach(() => vi.unstubAllEnvs());

describe('home (vi)', () => {
  it('lists the post with company, first key number and whole minutes', async () => {
    const html = await render(FIXTURE_ROOT);
    expect(html).toContain('href="/vi/posts/good-post"');
    expect(html).toContain(GOOD_TITLE);
    expect(html).toMatch(/class="mono-label[^"]*">Discord</);
    expect(html).toMatch(/class="font-mono[^"]*">177 → 72</);
    expect(html).toContain('Số node database, Cassandra sang ScyllaDB');
    const n = listPosts('tests/fixtures/posts')[0].locales.vi!.readingTime.whole;
    expect(html).toContain(`${n} phút đọc`);
  });

  it('has the tagline, the skip-link target and the skip link', async () => {
    const html = await render(FIXTURE_ROOT);
    expect(html).toContain('<h1');
    expect(html).toContain('id="content"');
    expect(html).toContain('href="#content"');
    expect(html).toContain('Bài học từ hệ thống lớn, cho team nhỏ');
    expect(html).toContain('aria-label="Chuyển sang tiếng Anh (EN)"');
  });

  it('renders the en home', async () => {
    const html = await render(FIXTURE_ROOT, 'en');
    expect(html).toContain('href="/en/posts/good-post"');
    expect(html).toContain('min read');
    expect(html).toContain('Lessons from big systems, for small teams');
  });

  it('exports metadata with title, tagline description and alternates', async () => {
    vi.resetModules();
    const { generateMetadata } = await import('@/app/[locale]/page');
    const vi_ = await generateMetadata({ params: Promise.resolve({ locale: 'vi' }) });
    expect(vi_.title).toBe('Hệ thống lớn');
    expect(vi_.description).toBe('Bài học từ hệ thống lớn, cho team nhỏ');
    expect(vi_.alternates).toEqual({
      canonical: '/vi',
      languages: { vi: '/vi', en: '/en', 'x-default': '/vi' },
    });
    expect(vi_.openGraph).toEqual({ locale: 'vi' });
    const en = await generateMetadata({ params: Promise.resolve({ locale: 'en' }) });
    expect(en.title).toBe('Hệ thống lớn');
    expect(en.description).toBe('Lessons from big systems, for small teams');
    expect(en.alternates?.canonical).toBe('/en');
  });

  describe('ordering', () => {
    const tmp = mkdtempSync(path.join(tmpdir(), 'home-'));
    afterEach(() => rmSync(tmp, { recursive: true, force: true }));

    it('puts the newest publishedAt first', async () => {
      cpSync(FIXTURE, path.join(tmp, 'good-post'), { recursive: true });
      cpSync(FIXTURE, path.join(tmp, 'a-older-post'), { recursive: true });
      const pj = path.join(tmp, 'a-older-post', 'post.json');
      writeFileSync(
        pj,
        JSON.stringify({ ...meta, slug: 'a-older-post', publishedAt: '2026-01-01' }),
      );
      const html = await render(tmp);
      const newer = html.indexOf('/vi/posts/good-post');
      const older = html.indexOf('/vi/posts/a-older-post');
      expect(newer).toBeGreaterThanOrEqual(0);
      expect(older).toBeGreaterThan(newer);
    });
  });
});
