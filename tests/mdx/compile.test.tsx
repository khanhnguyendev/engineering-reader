// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { parsePost, readRawPost } from '@/lib/content/load';
import { hashBlock, svgName } from '@/lib/content/mermaid';
import { compilePostBody } from '@/lib/mdx/compile';

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
    expect(renderToStaticMarkup(content)).toContain('href="#S1"');
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
});
