// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { mermaidBlocksOf, parsePost, readRawPost } from '@/lib/content/load';
import { hashBlock, svgName } from '@/lib/content/mermaid';
import { compilePostBody } from '@/lib/mdx/compile';
import { slugify } from '@/lib/mdx/rehype-sections';

const FIXTURE = path.resolve(import.meta.dirname, '../fixtures/posts/good-post');
let tmp: string;
let dir: string;

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), 'mdx-'));
  dir = path.join(tmp, 'good-post');
  cpSync(FIXTURE, dir, { recursive: true });
});
afterEach(() => rmSync(tmp, { recursive: true, force: true }));

function load() {
  const { post, issues } = parsePost(readRawPost(dir));
  if (!post) throw new Error(JSON.stringify(issues));
  return post;
}

describe('compilePostBody', () => {
  it('renders refs as anchors', async () => {
    const { content } = await compilePostBody(load(), 'vi');
    expect(renderToStaticMarkup(content)).toContain('<a href="#S1" class="ref"><span class="ref-id">[S1]</span></a>');
  });

  it('appends a permalink anchor to each section h2', async () => {
    const { content, headings } = await compilePostBody(load(), 'vi', 'Liên kết đến mục này');
    const html = renderToStaticMarkup(content);
    expect(html).toMatch(
      new RegExp(`<div class="h2-row"><h2[^>]*>[^<]*(?:<(?!/h2)[^>]*>[^<]*)*</h2><a href="#${headings[0].id}" class="h2-anchor" aria-label="Liên kết đến mục này">#</a></div>`),
    );
    expect(headings.every((h) => !h.text.endsWith('#'))).toBe(true);
  });

  it('falls back to a code block when no SVG exists', async () => {
    const { content } = await compilePostBody(load(), 'vi');
    expect(renderToStaticMarkup(content)).toContain('language-mermaid');
  });

  it('inlines a fresh SVG', async () => {
    const post = load();
    const src = post.locales.vi!.mermaidBlocks[0];
    writeFileSync(
      path.join(dir, svgName('vi', 0)),
      `<!-- mermaid:${hashBlock(src)} -->\n<svg viewBox="0 0 1 1"></svg>`,
    );
    const { content } = await compilePostBody(post, 'vi');
    const html = renderToStaticMarkup(content);
    expect(html).toContain('<svg');
    expect(html).not.toContain('language-mermaid');
    expect(html).not.toContain('mermaid:');
  });

  it('renders a figcaption from the fence meta and keeps the hash caption-free', async () => {
    const post = load();
    const src = post.locales.vi!.mermaidBlocks[0];
    writeFileSync(
      path.join(dir, svgName('vi', 0)),
      `<!-- mermaid:${hashBlock(src)} -->\n<svg viewBox="0 0 1 1"></svg>`,
    );
    post.locales.vi!.body = post.locales.vi!.body.replace(/^```mermaid[^\n]*$/m, '```mermaid caption="Một dòng mô tả."');
    expect(mermaidBlocksOf(post.locales.vi!.body)[0]).toBe(src);
    const html = renderToStaticMarkup((await compilePostBody(post, 'vi')).content);
    expect(html).toMatch(/<figcaption class="mt-2 text-\[13px\] leading-\[1\.45\] text-muted">Một dòng mô tả\.<\/figcaption>/);
    expect(html).toContain('<svg');
  });

  it('renders the caption in the code-block fallback too', async () => {
    const post = load();
    post.locales.vi!.body = post.locales.vi!.body.replace(/^```mermaid[^\n]*$/m, '```mermaid caption="Mô tả."');
    const html = renderToStaticMarkup((await compilePostBody(post, 'vi')).content);
    expect(html).toContain('language-mermaid');
    expect(html).toMatch(/<figcaption[^>]*>Mô tả\.<\/figcaption>/);
  });

  it('renders no figcaption without a caption', async () => {
    const post = load();
    const src = post.locales.vi!.mermaidBlocks[0];
    writeFileSync(
      path.join(dir, svgName('vi', 0)),
      `<!-- mermaid:${hashBlock(src)} -->\n<svg viewBox="0 0 1 1"></svg>`,
    );
    const html = renderToStaticMarkup((await compilePostBody(post, 'vi')).content);
    expect(html).not.toContain('figcaption');
  });

  it('falls back when the SVG is stale', async () => {
    const post = load();
    writeFileSync(path.join(dir, svgName('vi', 0)), `<!-- mermaid:deadbeef -->\n<svg></svg>`);
    const { content } = await compilePostBody(post, 'vi');
    expect(renderToStaticMarkup(content)).toContain('language-mermaid');
  });

  it('wraps each h2 in a panel section and collects headings', async () => {
    const post = load();
    const h2s = post.locales.vi!.body.match(/^## /gm)!.length;
    const { content, headings } = await compilePostBody(post, 'vi');
    const html = renderToStaticMarkup(content);
    expect(html.match(/<section class="panel"/g)!.length).toBe(h2s);
    expect(headings).toHaveLength(h2s);
    expect(new Set(headings.map((h) => h.id)).size).toBe(h2s);
    for (const h of headings) expect(html).toContain(`id="${h.id}"`);
  });

  it('highlights fenced code', async () => {
    const post = load();
    post.locales.vi!.body += '\n\n```ts\nconst a: number = 1;\n```\n';
    const { content } = await compilePostBody(post, 'vi');
    expect(renderToStaticMarkup(content)).toContain('data-rehype-pretty-code-figure');
  });

  it('does not style unlabelled fences as inline code', async () => {
    const post = load();
    post.locales.vi!.body += '\n\n```\nplain fence\n```\n';
    const { content } = await compilePostBody(post, 'vi');
    const html = renderToStaticMarkup(content);
    const pre = html.slice(html.indexOf('plain fence') - 400, html.indexOf('plain fence') + 50);
    expect(pre).toContain('<pre');
    expect(pre).not.toContain('rounded-sm');
    expect(pre).not.toContain('font-mono');
  });

  it('keeps refs inside inline code literal and renders locators', async () => {
    const raw = readRawPost(dir);
    const meta = raw.meta as { sources: Array<Record<string, unknown>> };
    meta.sources.push({ ...meta.sources[0], id: 'S2' });
    writeFileSync(path.join(dir, 'post.json'), JSON.stringify(meta));
    const post = load();
    post.locales.vi!.body += '\n\nXem `[S1]` và [S2 §3]\n';
    const { content } = await compilePostBody(post, 'vi');
    const html = renderToStaticMarkup(content);
    expect(html).toMatch(/<code[^>]*>\[S1\]<\/code>/);
    expect(html).toContain('<a href="#S2" class="ref"><span class="ref-id">[S2</span> §3]</a>');
  });

  it('leaves content before the first h2 unwrapped', async () => {
    const post = load();
    post.locales.vi!.body = 'Đoạn mở đầu.\n\n' + post.locales.vi!.body;
    const { content } = await compilePostBody(post, 'vi');
    const html = renderToStaticMarkup(content);
    expect(html.indexOf('Đoạn mở đầu.')).toBeLessThan(html.indexOf('<section'));
  });

  it('marks external links', async () => {
    const post = load();
    post.locales.vi!.body += '\n\n[ext](https://example.com) [pr](//example.com) [in](/vi)\n';
    const { content } = await compilePostBody(post, 'vi');
    const html = renderToStaticMarkup(content);
    expect(html).toMatch(/<a href="https:\/\/example.com" rel="noopener noreferrer" target="_blank">/);
    expect(html).toMatch(/<a href="\/\/example.com" rel="noopener noreferrer" target="_blank">/);
    expect(html).not.toMatch(/<a [^>]*href="\/vi"[^>]*target/);
  });

  it('indexes mermaid fences consistently with mermaidBlocksOf', async () => {
    const post = load();
    post.locales.vi!.body += '\n\n~~~mermaid\ngraph TD; X-->Y\n~~~\n';
    expect(post.locales.vi!.mermaidBlocks).toHaveLength(1);
    const { content } = await compilePostBody(post, 'vi');
    const html = renderToStaticMarkup(content);
    expect(html.match(/diagram-fallback/g)).toHaveLength(1);
  });

  it('ignores nested and four-backtick mermaid fences', async () => {
    const post = load();
    const body =
      '- item\n\n  ```mermaid\n  graph TD; N-->M\n  ```\n\n' +
      '````mermaid\ngraph TD; F-->G\n````\n\n' +
      '```mermaid\ngraph TD; TOP-->LEVEL\n```\n';
    post.locales.vi!.body = body;
    post.locales.vi!.mermaidBlocks = mermaidBlocksOf(body);
    expect(post.locales.vi!.mermaidBlocks).toHaveLength(1);
    const { content } = await compilePostBody(post, 'vi');
    const html = renderToStaticMarkup(content);
    expect(html.match(/class="diagram(-fallback)?"/g)).toHaveLength(1);
    expect(html).toContain('TOP--&gt;LEVEL');
  });

  it('keeps ref text in headings', async () => {
    const post = load();
    post.locales.vi!.body += '\n\n## Có ref [S1 §2]\n\nx\n';
    const { headings } = await compilePostBody(post, 'vi');
    expect(headings.at(-1)!.text).toBe('Có ref [S1 §2]');
  });
});

describe('slugify', () => {
  it('transliterates Vietnamese', () => {
    expect(slugify('Đợt migrate')).toBe('dot-migrate');
  });
  it('dedupes duplicate h2s', async () => {
    const { post } = parsePost(readRawPost(dir));
    post!.locales.vi!.body = '## X\n\na\n\n## X\n\nb\n';
    const { headings } = await compilePostBody(post!, 'vi');
    expect(headings.map((h) => h.id)).toEqual(['x', 'x-2']);
  });
});
