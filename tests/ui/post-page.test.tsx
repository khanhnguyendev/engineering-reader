// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';

// "server-only" is resolved by Next's bundler; under vitest it is an empty module.
vi.mock('server-only', () => ({}));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/vi/posts/good-post',
}));

const FIXTURE_ROOT = 'tests/fixtures/posts';
const FIXTURE = path.join(FIXTURE_ROOT, 'good-post');
const viSource = readFileSync(path.join(FIXTURE, 'vi.mdx'), 'utf8');
const meta = JSON.parse(readFileSync(path.join(FIXTURE, 'post.json'), 'utf8'));

function fm(field: string): string {
  // first YAML list item or scalar for `field` in the vi frontmatter
  const m = viSource.match(new RegExp(`^${field}:\\s*(?:"([^"]*)"|\\n\\s+- "([^"]*)")`, 'm'));
  if (!m) throw new Error(`no ${field} in fixture`);
  return m[1] ?? m[2];
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function load(root: string) {
  vi.resetModules();
  vi.stubEnv('CONTENT_ROOT', root);
  return import('@/app/[locale]/posts/[slug]/page');
}

async function render(root: string, locale: string, slug = 'good-post') {
  const { default: Page } = await load(root);
  const el = await Page({ params: Promise.resolve({ locale, slug }) });
  return renderToStaticMarkup(el);
}

afterEach(() => vi.unstubAllEnvs());

describe('post page (vi)', () => {
  let html: string;
  beforeEach(async () => {
    html = await render(FIXTURE_ROOT, 'vi');
  });

  it('renders the top layer in order, then the divider, then the deep layer', () => {
    const at = (needle: string) => {
      const i = html.indexOf(needle);
      expect(i, `missing: ${needle}`).toBeGreaterThanOrEqual(0);
      return i;
    };
    const h1 = at('<h1');
    const summary = at(escape(fm('summary')));
    const keyNumber = at(escape(meta.keyNumbers[0].value));
    const tldr = at(escape(fm('tldr')));
    const smallTeam = at(escape(fm('smallTeam')));
    const deep = at('ĐỌC SÂU · ');
    const firstSection = at('<section class="panel" id=');
    expect(h1).toBeLessThan(summary);
    expect(summary).toBeLessThan(keyNumber);
    expect(keyNumber).toBeLessThan(tldr);
    expect(tldr).toBeLessThan(smallTeam);
    expect(smallTeam).toBeLessThan(deep);
    expect(deep).toBeLessThan(firstSection);
  });

  it('anchors sources by id and shows the AI line', () => {
    expect(html).toContain('id="S1"');
    expect(html).toContain('Soạn thảo với AI từ các nguồn trên, Ryan đọc lại và biên tập.');
  });

  it('has the skip-link target and the sources anchor', () => {
    expect(html).toContain('id="content"');
    expect(html).toContain('href="#content"');
    expect(html).toContain('id="post-sources"');
  });

  it('links key numbers to their source', () => {
    expect(html).toContain('href="#S1"');
  });

  it('shows the Lessons heading when lessons exist', () => {
    expect(html).toContain('>Bài học<');
  });

  it('marks the small-team block as the callout', () => {
    expect(html).toContain('class="callout');
  });
});

describe('post page variants', () => {
  let tmp: string;
  beforeEach(() => {
    tmp = mkdtempSync(path.join(tmpdir(), 'post-page-'));
    cpSync(FIXTURE, path.join(tmp, 'good-post'), { recursive: true });
  });
  afterEach(() => rmSync(tmp, { recursive: true, force: true }));

  function edit(file: string, f: (s: string) => string) {
    const p = path.join(tmp, 'good-post', file);
    writeFileSync(p, f(readFileSync(p, 'utf8')));
  }

  it('omits the Lessons heading when lessons are absent', async () => {
    edit('vi.mdx', (s) => s.replace(/^lessons:\n(?:\s+- .*\n)+/m, ''));
    const html = await render(tmp, 'vi');
    expect(html).not.toContain('>Bài học<');
  });

  it('notes the missing English twin when en is a draft', async () => {
    edit('en.mdx', (s) => s.replace(/^---\n/, '---\ndraft: true\n'));
    const html = await render(tmp, 'vi');
    expect(html).toContain('Bài này chưa có bản tiếng Anh.');
  });

  it('does not note a missing twin when both locales exist', async () => {
    const html = await render(tmp, 'vi');
    expect(html).not.toContain('Bài này chưa có bản tiếng Anh.');
  });

  it('omits the draft locale from static params and alternates', async () => {
    edit('en.mdx', (s) => s.replace(/^---\n/, '---\ndraft: true\n'));
    const mod = await load(tmp);
    expect(mod.generateStaticParams()).toEqual([{ locale: 'vi', slug: 'good-post' }]);
    const md = await mod.generateMetadata({
      params: Promise.resolve({ locale: 'vi', slug: 'good-post' }),
    });
    expect(md.alternates?.languages).toEqual({
      vi: '/vi/posts/good-post',
      'x-default': '/vi/posts/good-post',
    });
  });

  it('has no x-default when only en exists', async () => {
    rmSync(path.join(tmp, 'good-post', 'vi.mdx'));
    const mod = await load(tmp);
    expect(mod.generateStaticParams()).toEqual([{ locale: 'en', slug: 'good-post' }]);
    const md = await mod.generateMetadata({
      params: Promise.resolve({ locale: 'en', slug: 'good-post' }),
    });
    expect(md.alternates?.languages).toEqual({ en: '/en/posts/good-post' });
  });
});
