import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  readRawPost,
  parsePost,
  listPosts,
  listPostsBy,
  getPost,
  hasLocale,
  _resetListPostsCache,
} from '@/lib/content/load';
import { loadVocab, _resetVocabCache } from '@/lib/content/vocab';

const FIXTURES = path.resolve(import.meta.dirname, '../fixtures/posts');
const GOOD = path.join(FIXTURES, 'good-post');

let tmp: string;
beforeAll(() => {
  tmp = mkdtempSync(path.join(tmpdir(), 'load-test-'));
});
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

function copyGood(name: string): string {
  const dest = path.join(tmp, name);
  cpSync(GOOD, dest, { recursive: true });
  return dest;
}

describe('readRawPost', () => {
  it('normalizes a CRLF + BOM copy to equal the LF copy', () => {
    const dir = path.join(tmp, 'crlf', 'good-post');
    cpSync(GOOD, dir, { recursive: true });
    for (const l of ['vi', 'en']) {
      const f = path.join(dir, `${l}.mdx`);
      const lf = readFileSync(f, 'utf8');
      writeFileSync(f, '﻿' + lf.replace(/\n/g, '\r\n'));
    }
    const a = readRawPost(GOOD);
    const b = readRawPost(dir);
    expect(b.locales).toEqual(a.locales);
    expect(b.meta).toEqual(a.meta);
  });

  it('does not throw on malformed post.json', () => {
    const dir = path.join(copyGood('badjson'));
    writeFileSync(path.join(dir, 'post.json'), '{ nope');
    const raw = readRawPost(dir);
    expect(raw.meta).toHaveProperty('__parseError');
    const { post, issues } = parsePost(raw);
    expect(post).toBeUndefined();
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].file).toBe('post.json');
  });
});

describe('parsePost', () => {
  it('parses both locales of the good fixture', () => {
    const { post, issues } = parsePost(readRawPost(GOOD));
    expect(issues).toEqual([]);
    expect(post).toBeDefined();
    const p = post!;
    expect(Object.keys(p.locales).sort()).toEqual(['en', 'vi']);
    for (const l of ['vi', 'en'] as const) {
      const d = p.locales[l]!;
      expect(d.mermaidBlocks).toHaveLength(1);
      expect(d.refs.map((r) => r.id)).toContain('S1');
    }
    const { vi, en } = p.locales;
    expect(vi!.readingTime.deep).toBeGreaterThanOrEqual(6);
    expect(vi!.readingTime.deep).toBeLessThanOrEqual(10);
    expect(en!.readingTime.deep).toBeGreaterThanOrEqual(6);
    expect(en!.readingTime.deep).toBeLessThanOrEqual(10);
    for (const d of [vi!, en!]) {
      expect(d.readingTime.whole).toBeGreaterThanOrEqual(8);
      expect(d.readingTime.whole).toBeLessThanOrEqual(12);
    }
  });

  it('reports schema issues with the file name and returns no post', () => {
    const dir = copyGood('badfm');
    const f = path.join(dir, 'vi.mdx');
    writeFileSync(f, readFileSync(f, 'utf8').replace(/^tldr:[\s\S]*?\nkeyNumberLabels/m, 'tldr: [a]\nkeyNumberLabels'));
    const { post, issues } = parsePost(readRawPost(dir));
    expect(post).toBeUndefined();
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.every((i) => i.file === 'vi.mdx')).toBe(true);
  });

  it('reports malformed YAML frontmatter against the locale file', () => {
    const dir = copyGood('badyaml');
    writeFileSync(path.join(dir, 'vi.mdx'), '---\ntitle: [unclosed\n---\n\nbody\n');
    const raw = readRawPost(dir);
    const { post, issues } = parsePost(raw);
    expect(post).toBeUndefined();
    expect(issues[0].file).toBe('vi.mdx');
  });

  it('keeps a draft locale in raw but excludes it from the record', () => {
    const dir = copyGood('draft');
    const f = path.join(dir, 'en.mdx');
    writeFileSync(f, readFileSync(f, 'utf8').replace(/^---\n/, '---\ndraft: true\n'));
    const raw = readRawPost(dir);
    expect(raw.locales.en?.draft).toBe(true);
    const { post, issues } = parsePost(raw);
    expect(issues).toEqual([]);
    expect(hasLocale(post!, 'en')).toBe(false);
    expect(hasLocale(post!, 'vi')).toBe(true);
  });
});

describe('listPosts / listPostsBy / getPost', () => {
  const root = () => path.join(tmp, 'root');
  beforeAll(() => {
    cpSync(GOOD, path.join(root(), 'good-post'), { recursive: true });
  });

  it('lists one post', () => {
    expect(listPosts(root())).toHaveLength(1);
    expect(getPost(root(), 'good-post')?.slug).toBe('good-post');
    expect(getPost(root(), 'missing')).toBeUndefined();
  });

  it('sorts by publishedAt desc then slug asc', () => {
    const sortRoot = path.join(tmp, 'sortroot');
    const dates: Record<string, string> = { a: '2026-01-02', b: '2026-01-01', c: '2026-01-02' };
    for (const [slug, date] of Object.entries(dates)) {
      const dir = path.join(sortRoot, slug);
      cpSync(GOOD, dir, { recursive: true });
      const f = path.join(dir, 'post.json');
      const meta = JSON.parse(readFileSync(f, 'utf8'));
      writeFileSync(f, JSON.stringify({ ...meta, slug, publishedAt: date }));
    }
    expect(listPosts(sortRoot).map((p) => p.slug)).toEqual(['a', 'c', 'b']);
  });

  it('filters by company, topic, tag', () => {
    expect(listPostsBy(root(), { company: 'discord' })).toHaveLength(1);
    expect(listPostsBy(root(), { topic: 'infra' })).toHaveLength(0);
    expect(listPostsBy(root(), { tag: 'rust' })).toHaveLength(1);
    expect(listPostsBy(root(), { company: 'discord', topic: 'infra' })).toHaveLength(0);
  });

  it('throws listing issues when a post is invalid', () => {
    const bad = path.join(tmp, 'badroot');
    cpSync(GOOD, path.join(bad, 'bad-post'), { recursive: true });
    writeFileSync(path.join(bad, 'bad-post', 'post.json'), '{ nope');
    expect(() => listPosts(bad)).toThrow(/bad-post\/post\.json/);
  });
});

describe('memoization', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    _resetListPostsCache();
    _resetVocabCache();
  });

  it('listPosts is memoized per root until reset, and frozen', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const r = path.join(tmp, 'memo');
    cpSync(GOOD, path.join(r, 'good-post'), { recursive: true });
    _resetListPostsCache();
    const first = listPosts(r);
    expect(listPosts(r)).toBe(first);
    expect(Object.isFrozen(first)).toBe(true);
    const dir = path.join(r, 'second-post');
    cpSync(GOOD, dir, { recursive: true });
    const f = path.join(dir, 'post.json');
    writeFileSync(f, JSON.stringify({ ...JSON.parse(readFileSync(f, 'utf8')), slug: 'second-post' }));
    expect(listPosts(r)).toHaveLength(1);
    _resetListPostsCache();
    expect(listPosts(r)).toHaveLength(2);
  });

  it('loadVocab is memoized per root until reset', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const r = path.join(tmp, 'memo-vocab');
    cpSync(path.resolve(import.meta.dirname, '../../content'), r, {
      recursive: true,
      filter: (src) => !src.includes(`${path.sep}posts`),
    });
    _resetVocabCache();
    const first = loadVocab(r);
    expect(loadVocab(r)).toBe(first);
    writeFileSync(path.join(r, 'series.json'), JSON.stringify({ s: { slugs: ['a'], vi: 'x', en: 'y' } }));
    expect(loadVocab(r)).toBe(first);
    _resetVocabCache();
    expect(Object.keys(loadVocab(r).series)).toEqual(['s']);
  });

  it('listPosts bypasses the cache outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const r = path.join(tmp, 'dev-bypass');
    cpSync(GOOD, path.join(r, 'good-post'), { recursive: true });
    _resetListPostsCache();
    const first = listPosts(r);
    expect(first).toHaveLength(1);
    const dir = path.join(r, 'second-post');
    cpSync(GOOD, dir, { recursive: true });
    const f = path.join(dir, 'post.json');
    writeFileSync(f, JSON.stringify({ ...JSON.parse(readFileSync(f, 'utf8')), slug: 'second-post' }));
    expect(listPosts(r)).toHaveLength(2);
  });

  it('loadVocab bypasses the cache outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const r = path.join(tmp, 'dev-bypass-vocab');
    cpSync(path.resolve(import.meta.dirname, '../../content'), r, {
      recursive: true,
      filter: (src) => !src.includes(`${path.sep}posts`),
    });
    _resetVocabCache();
    const first = loadVocab(r);
    writeFileSync(path.join(r, 'series.json'), JSON.stringify({ s: { slugs: ['a'], vi: 'x', en: 'y' } }));
    const second = loadVocab(r);
    expect(second).not.toBe(first);
    expect(Object.keys(second.series)).toEqual(['s']);
  });

  it('loadVocab reads featured.json', () => {
    const r = path.join(tmp, 'featured-vocab');
    cpSync(path.resolve(import.meta.dirname, '../../content'), r, {
      recursive: true,
      filter: (src) => !src.includes(`${path.sep}posts`),
    });
    writeFileSync(path.join(r, 'featured.json'), JSON.stringify(['good-post']));
    expect(loadVocab(r).featured).toEqual(['good-post']);
    writeFileSync(path.join(r, 'featured.json'), JSON.stringify(['Not A Slug']));
    expect(() => loadVocab(r)).toThrow();
  });
});
