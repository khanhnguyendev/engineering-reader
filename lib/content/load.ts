import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { ZodIssue } from 'zod';
import { LOCALES, type Locale } from '@/lib/i18n';
import {
  PostJsonSchema,
  LocaleFrontmatterSchema,
  type PostJson,
  type LocaleFrontmatter,
} from '@/lib/content/schema';
import { countWords, readingTime, WPM } from '@/lib/content/reading-time';
import { extractRefs, type Ref } from '@/lib/content/refs';

export type RawLocale = { file: string; frontmatter: unknown; body: string; draft: boolean };
export type RawPost = {
  slug: string;
  dir: string;
  meta: unknown;
  locales: Partial<Record<Locale, RawLocale>>;
};
export type LocaleDoc = {
  frontmatter: LocaleFrontmatter;
  body: string;
  readingTime: { deep: number; whole: number };
  refs: Ref[];
  mermaidBlocks: string[];
};
export type PostRecord = {
  slug: string;
  dir: string;
  meta: PostJson;
  locales: Partial<Record<Locale, LocaleDoc>>;
};
export type ZodIssueWithFile = ZodIssue & { file: string };

export const CONTENT_ROOT = process.env.CONTENT_ROOT ?? 'content/posts';

function normalizeText(s: string): string {
  return s.replace(/^﻿/, '').replace(/\r\n/g, '\n').normalize('NFC');
}

export function readRawPost(dir: string): RawPost {
  const slug = path.basename(dir);
  let meta: unknown;
  try {
    meta = JSON.parse(normalizeText(readFileSync(path.join(dir, 'post.json'), 'utf8')));
  } catch (e) {
    meta = { __parseError: e instanceof Error ? e.message : String(e) };
  }
  const locales: Partial<Record<Locale, RawLocale>> = {};
  for (const locale of LOCALES) {
    const file = `${locale}.mdx`;
    const full = path.join(dir, file);
    if (!existsSync(full)) continue;
    try {
      const parsed = matter(normalizeText(readFileSync(full, 'utf8')));
      const data = parsed.data as Record<string, unknown>;
      locales[locale] = {
        file,
        frontmatter: data,
        body: parsed.content,
        draft: data.draft === true,
      };
    } catch (e) {
      locales[locale] = {
        file,
        frontmatter: { __parseError: e instanceof Error ? e.message : String(e) },
        body: '',
        draft: false,
      };
    }
  }
  return { slug, dir, meta, locales };
}

export function mermaidBlocksOf(body: string): string[] {
  return [...body.matchAll(/^```mermaid[^\n]*\n([\s\S]*?)^```/gm)].map((m) => m[1].trim());
}

function words(...parts: (string | string[] | undefined)[]): number {
  return parts.flat().reduce<number>((n, p) => n + (p ? countWords(p) : 0), 0);
}

export function parsePost(raw: RawPost): { post?: PostRecord; issues: ZodIssueWithFile[] } {
  const issues: ZodIssueWithFile[] = [];
  const metaResult = PostJsonSchema.safeParse(raw.meta);
  if (!metaResult.success) {
    for (const i of metaResult.error.issues) issues.push({ ...i, file: 'post.json' });
  }
  const docs: Partial<Record<Locale, { raw: RawLocale; fm: LocaleFrontmatter }>> = {};
  for (const locale of LOCALES) {
    const rl = raw.locales[locale];
    if (!rl || rl.draft) continue;
    const r = LocaleFrontmatterSchema.safeParse(rl.frontmatter);
    if (r.success) docs[locale] = { raw: rl, fm: r.data };
    else for (const i of r.error.issues) issues.push({ ...i, file: rl.file });
  }
  if (issues.length > 0 || !metaResult.success) return { issues };

  const locales: Partial<Record<Locale, LocaleDoc>> = {};
  for (const locale of LOCALES) {
    const d = docs[locale];
    if (!d) continue;
    const { body } = d.raw;
    const fm = d.fm;
    const top = words(
      fm.summary,
      fm.tldr,
      fm.smallTeam,
      fm.lessons,
      Object.values(fm.keyNumberLabels),
    );
    locales[locale] = {
      frontmatter: fm,
      body,
      readingTime: {
        deep: readingTime(body, locale).minutes,
        whole: Math.ceil((countWords(body) + top) / WPM[locale]),
      },
      refs: extractRefs(body),
      mermaidBlocks: mermaidBlocksOf(body),
    };
  }
  return { post: { slug: raw.slug, dir: raw.dir, meta: metaResult.data, locales }, issues };
}

const listPostsCache = new Map<string, readonly PostRecord[]>();

export function _resetListPostsCache(): void {
  listPostsCache.clear();
}

/** Memoized per root in production; `next dev` re-reads so content edits show up. */
export function listPosts(root: string = CONTENT_ROOT): readonly PostRecord[] {
  const memo = process.env.NODE_ENV === 'production';
  const cached = memo ? listPostsCache.get(root) : undefined;
  if (cached) return cached;
  const posts = Object.freeze(loadPosts(root));
  if (memo) listPostsCache.set(root, posts);
  return posts;
}

function loadPosts(root: string): PostRecord[] {
  if (!existsSync(root)) return [];
  const posts: PostRecord[] = [];
  const lines: string[] = [];
  for (const name of readdirSync(root).sort()) {
    const dir = path.join(root, name);
    if (!statSync(dir).isDirectory() || !existsSync(path.join(dir, 'post.json'))) continue;
    const { post, issues } = parsePost(readRawPost(dir));
    for (const i of issues) {
      lines.push(`${name}/${i.file}: ${i.path.join('.') || '(root)'} ${i.message}`);
    }
    if (post) posts.push(post);
  }
  if (lines.length > 0) throw new Error(`Invalid content:\n${lines.join('\n')}`);
  return posts.sort(
    (a, b) =>
      b.meta.publishedAt.localeCompare(a.meta.publishedAt) || a.slug.localeCompare(b.slug),
  );
}

export function getPost(root: string, slug: string): PostRecord | undefined {
  return listPosts(root).find((p) => p.slug === slug);
}

export function hasLocale(p: PostRecord, l: Locale): boolean {
  return p.locales[l] !== undefined;
}

export function listPostsBy(
  root: string,
  filter: { company?: string; topic?: string; tag?: string; series?: string },
): PostRecord[] {
  return listPosts(root).filter(
    (p) =>
      (filter.company === undefined || p.meta.company === filter.company) &&
      (filter.topic === undefined || p.meta.topic === filter.topic) &&
      (filter.tag === undefined || p.meta.tags.includes(filter.tag)) &&
      (filter.series === undefined || p.meta.series === filter.series),
  );
}
