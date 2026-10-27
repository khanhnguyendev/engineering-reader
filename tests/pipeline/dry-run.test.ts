import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateAll } from '@/lib/content/validate';
import { loadVocab } from '@/lib/content/vocab';
import { dryRunUrl, isValidSlug, prepareDryRun } from '@/lib/pipeline/dry-run';

const FIXTURE = 'tests/fixtures/posts/good-post';
const KEY = 'https://discord.com/blog/how-discord-stores-trillions-of-messages?dry-run=dry-run-x';
const TODAY = '2026-10-27';

function tmpRoot(seen: object = {}): string {
  const root = path.join(mkdtempSync(path.join(os.tmpdir(), 'dry-run-')), 'x');
  mkdirSync(path.join(root, 'posts'), { recursive: true });
  writeFileSync(path.join(root, 'seen.json'), JSON.stringify(seen));
  return root;
}
const run = (root: string, slug = 'dry-run-x') =>
  prepareDryRun({ fixtureDir: FIXTURE, contentRoot: root, slug, today: TODAY });

describe('prepareDryRun', () => {
  it('copies only post.json and the mdx files, rewriting post.json', () => {
    const root = tmpRoot();
    const { postDir } = run(root);
    expect(readdirSync(postDir).sort()).toEqual(['en.mdx', 'post.json', 'vi.mdx']);
    const post = JSON.parse(readFileSync(path.join(postDir, 'post.json'), 'utf8'));
    expect(post.slug).toBe('dry-run-x');
    expect(post.author).toBe('pipeline');
    expect(post.reviewedBy).toBe('ryan');
    expect(post.publishedAt).toBe(TODAY);
    expect(post.featured).toBe(false);
    expect(post.sources[0].url).toBe(KEY);
  });

  it('adds the ledger entry and keeps existing ones', () => {
    const other = { company: 'x', seenAt: '2026-01-01', decision: 'skipped', reason: 'off topic' };
    const root = tmpRoot({ 'https://a.example/z': other });
    const { seenKey } = run(root);
    expect(seenKey).toBe(KEY);
    const text = readFileSync(path.join(root, 'seen.json'), 'utf8');
    expect(text.endsWith('\n')).toBe(true);
    const seen = JSON.parse(text);
    expect(seen['https://a.example/z']).toEqual(other);
    expect(seen[KEY]).toEqual({
      company: 'discord',
      seenAt: TODAY,
      decision: 'picked',
      slug: 'dry-run-x',
    });
  });

  it('throws when the post dir exists', () => {
    const root = tmpRoot();
    run(root);
    expect(() => run(root)).toThrow('already exists');
  });

  it('produces content that validates', () => {
    const root = tmpRoot();
    run(root);
    expect(existsSync(path.join(root, 'posts', 'dry-run-x'))).toBe(true);
    const r = validateAll(path.join(root, 'posts'), loadVocab(), { today: TODAY });
    expect(r.ok).toBe(true);
  });

  it('never overwrites an existing ledger key', () => {
    const root = tmpRoot({
      [KEY]: { company: 'discord', seenAt: TODAY, decision: 'picked', slug: 'dry-run-x' },
    });
    expect(() => run(root)).toThrow('already has');
  });
});

describe('isValidSlug', () => {
  it('accepts kebab-case and rejects the rest', () => {
    for (const ok of ['dry-run-x', 'a', 'dry-run-2026-10-27']) expect(isValidSlug(ok)).toBe(true);
    for (const bad of ['', 'Dry', '../x', 'a/b', 'a--b', '-a', 'a-', 'a b', undefined])
      expect(isValidSlug(bad)).toBe(false);
  });
});

describe('dryRunUrl', () => {
  it('sets the dry-run param, keeping existing ones', () => {
    expect(dryRunUrl('https://a.example/p', 's')).toBe('https://a.example/p?dry-run=s');
    expect(dryRunUrl('https://a.example/p?x=1', 's')).toBe('https://a.example/p?x=1&dry-run=s');
    expect(dryRunUrl('https://a.example/p?dry-run=old', 's')).toBe('https://a.example/p?dry-run=s');
  });
});
