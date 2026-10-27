import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { SeenSchema, type Seen } from '@/lib/content/schema';
import { normalizeSourceUrl } from '@/lib/content/normalize-url';

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const isValidSlug = (s: unknown): s is string => typeof s === 'string' && SLUG_RE.test(s);

export function dryRunUrl(url: string, slug: string): string {
  const u = new URL(url);
  u.searchParams.set('dry-run', slug);
  return u.toString();
}

export function prepareDryRun(o: {
  fixtureDir: string;
  contentRoot: string;
  slug: string;
  today: string;
}): { postDir: string; seenKey: string } {
  const postDir = path.join(o.contentRoot, 'posts', o.slug);
  if (existsSync(postDir)) throw new Error(`${postDir} already exists`);

  const post = JSON.parse(readFileSync(path.join(o.fixtureDir, 'post.json'), 'utf8'));
  post.slug = o.slug;
  post.author = 'pipeline';
  post.reviewedBy = 'ryan';
  post.publishedAt = o.today;
  post.featured = false;
  post.sources[0].url = dryRunUrl(post.sources[0].url, o.slug);
  const seenKey = normalizeSourceUrl(post.sources[0].url);

  const seenPath = path.join(o.contentRoot, 'seen.json');
  const seen: Seen = SeenSchema.parse(JSON.parse(readFileSync(seenPath, 'utf8')));
  if (seenKey in seen) throw new Error(`seen.json already has ${seenKey}`);
  seen[seenKey] = { company: post.company, seenAt: o.today, decision: 'picked', slug: o.slug };
  const sorted = Object.fromEntries(Object.entries(seen).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

  mkdirSync(postDir, { recursive: true });
  for (const f of ['vi.mdx', 'en.mdx']) cpSync(path.join(o.fixtureDir, f), path.join(postDir, f));
  writeFileSync(path.join(postDir, 'post.json'), JSON.stringify(post, null, 2) + '\n');
  writeFileSync(seenPath, JSON.stringify(sorted, null, 2) + '\n');
  return { postDir, seenKey };
}
