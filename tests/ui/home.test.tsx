// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
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
    expect(html).toContain('Discord');
    expect(html).toContain(meta.keyNumbers[0].value);
    expect(html).toContain('Số node database, Cassandra sang ScyllaDB');
    expect(html).toMatch(/\d+ phút/);
    expect(html).toContain('font-mono');
  });

  it('has the tagline, the skip-link target and the skip link', async () => {
    const html = await render(FIXTURE_ROOT);
    expect(html).toContain('<h1');
    expect(html).toContain('id="content"');
    expect(html).toContain('href="#content"');
    expect(html).toMatch(/<p[^>]*text-ink-2[^>]*>[^<]+<\/p>/);
  });

  describe('ordering', () => {
    const tmp = mkdtempSync(path.join(tmpdir(), 'home-'));
    afterEach(() => rmSync(tmp, { recursive: true, force: true }));

    it('puts the newest publishedAt first', async () => {
      cpSync(FIXTURE, path.join(tmp, 'good-post'), { recursive: true });
      cpSync(FIXTURE, path.join(tmp, 'older-post'), { recursive: true });
      const pj = path.join(tmp, 'older-post', 'post.json');
      writeFileSync(
        pj,
        JSON.stringify({ ...meta, slug: 'older-post', publishedAt: '2026-01-01' }),
      );
      const html = await render(tmp);
      const newer = html.indexOf('/vi/posts/good-post');
      const older = html.indexOf('/vi/posts/older-post');
      expect(newer).toBeGreaterThanOrEqual(0);
      expect(older).toBeGreaterThan(newer);
    });
  });
});
