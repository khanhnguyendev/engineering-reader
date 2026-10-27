import { describe, it, expect } from 'vitest';
import { PostJsonSchema, LocaleFrontmatterSchema, SeenEntrySchema, SeenSchema } from '@/lib/content/schema';
import { loadVocab } from '@/lib/content/vocab';

const base = () => ({
  slug: 'discord-cassandra-to-scylladb',
  company: 'discord',
  topic: 'data',
  caseType: 'migration',
  tags: ['cassandra', 'scylladb', 'storage'],
  series: null,
  publishedAt: '2026-10-20',
  updatedAt: null,
  sourcePublishedAt: '2023-03-06',
  featured: false,
  author: 'pipeline',
  reviewedBy: 'ryan',
  keyNumbers: [
    { id: 'nodes', value: '177 → 72', ref: 'S1' },
    { id: 'latency', value: 'p99 40–125 → 15 ms', ref: 'S1' },
    { id: 'migration', value: '9 d', ref: 'S1' },
  ],
  sources: [
    { id: 'S1', type: 'blog', title: 'How Discord Stores Trillions of Messages', authors: ['Bo Ingram'], publishedAt: '2023-03-06', url: 'https://discord.com/blog/how-discord-stores-trillions-of-messages', accessedAt: '2026-10-20', locator: null },
  ],
});

const fm = () => ({
  title: 'T',
  summary: 'S',
  tldr: ['a', 'b', 'c'],
  keyNumberLabels: { nodes: 'Nodes' },
  smallTeam: ['x', 'y'],
});

describe('PostJsonSchema', () => {
  it('accepts a Discord-shaped post', () => {
    expect(PostJsonSchema.safeParse(base()).success).toBe(true);
  });
  it('rejects unknown topic', () => {
    expect(PostJsonSchema.safeParse({ ...base(), topic: 'performance' }).success).toBe(false);
  });
  it('rejects 1 and 5 key numbers', () => {
    const k = base().keyNumbers;
    expect(PostJsonSchema.safeParse({ ...base(), keyNumbers: k.slice(0, 1) }).success).toBe(false);
    expect(PostJsonSchema.safeParse({ ...base(), keyNumbers: [...k, k[0], k[1]] }).success).toBe(false);
  });
  it('requires locator for talk with path sources.0.locator', () => {
    const b = base();
    b.sources[0].type = 'talk';
    const r = PostJsonSchema.safeParse(b);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.join('.') === 'sources.0.locator')).toBe(true);
    }
  });
  it('requires source ids shaped S<n>', () => {
    for (const id of ['S1', 'S12']) {
      const b = base();
      b.sources[0].id = id;
      b.keyNumbers.forEach((k) => (k.ref = id));
      expect(PostJsonSchema.safeParse(b).success).toBe(true);
    }
    for (const id of ['s1', 'S', 'source-1', 'S1a']) {
      const b = base();
      b.sources[0].id = id;
      const r = PostJsonSchema.safeParse(b);
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues.some((i) => i.path.join('.') === 'sources.0.id')).toBe(true);
    }
  });
  it('flags duplicate keyNumbers ids and duplicate source ids', () => {
    const b = base();
    b.keyNumbers[2].id = 'nodes';
    b.sources.push({ ...b.sources[0] });
    const r = PostJsonSchema.safeParse(b);
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('keyNumbers.2.id');
      expect(paths).toContain('sources.1.id');
      expect(paths).not.toContain('keyNumbers.0.id');
      expect(paths).not.toContain('sources.0.id');
    }
  });
});

describe('LocaleFrontmatterSchema', () => {
  it('rejects 161 code points', () => {
    expect(LocaleFrontmatterSchema.safeParse({ ...fm(), summary: 'a'.repeat(161) }).success).toBe(false);
  });
  it('accepts 160-code-point NFD Vietnamese string', () => {
    const s = 'ệ'.normalize('NFD').repeat(160);
    expect(Array.from(s).length).toBeGreaterThan(160);
    expect(LocaleFrontmatterSchema.safeParse({ ...fm(), summary: s }).success).toBe(true);
  });
  it('requires keyNumberLabels', () => {
    const { keyNumberLabels: _k, ...rest } = fm();
    void _k;
    expect(LocaleFrontmatterSchema.safeParse(rest).success).toBe(false);
  });
});

describe('strictness and url protocol', () => {
  it('rejects unknown keys in post.json and locale frontmatter', () => {
    expect(PostJsonSchema.safeParse({ ...base(), extra: 1 }).success).toBe(false);
    expect(LocaleFrontmatterSchema.safeParse({ ...fm(), extra: 1 }).success).toBe(false);
  });
  it('rejects http source urls', () => {
    const b = base();
    b.sources[0].url = 'http://discord.com/x';
    expect(PostJsonSchema.safeParse(b).success).toBe(false);
  });
  it('rejects non-http source urls', () => {
    const b = base();
    b.sources[0].url = 'ftp://discord.com/x';
    expect(PostJsonSchema.safeParse(b).success).toBe(false);
  });
});

describe('loadVocab', () => {
  it('loads the committed vocab with five topics', () => {
    const v = loadVocab();
    expect(v.topics.map((t) => t.slug).sort()).toEqual(
      ['data', 'distributed-systems', 'infra', 'realtime', 'reliability'],
    );
  });
});

describe('SeenEntrySchema', () => {
  const picked = { company: 'discord', seenAt: '2026-10-21', decision: 'picked', slug: 'good-post' };
  it('accepts valid picked, skipped, rejected', () => {
    expect(SeenEntrySchema.safeParse(picked).success).toBe(true);
    expect(SeenEntrySchema.safeParse({ company: 'x', seenAt: '2026-10-21', decision: 'skipped', reason: 'dup' }).success).toBe(true);
    expect(SeenEntrySchema.safeParse({ company: 'x', seenAt: '2026-10-21', decision: 'rejected', reason: 'thin' }).success).toBe(true);
  });
  it('picked requires slug', () => {
    expect(SeenEntrySchema.safeParse({ ...picked, slug: undefined }).success).toBe(false);
  });
  it('skipped and rejected require reason', () => {
    expect(SeenEntrySchema.safeParse({ company: 'x', seenAt: '2026-10-21', decision: 'skipped' }).success).toBe(false);
    expect(SeenEntrySchema.safeParse({ company: 'x', seenAt: '2026-10-21', decision: 'rejected' }).success).toBe(false);
  });
  it('deferred requires reason and forbids slug', () => {
    const d = { company: 'x', seenAt: '2026-10-21', decision: 'deferred', reason: 'over the cap of three' };
    expect(SeenEntrySchema.safeParse(d).success).toBe(true);
    expect(SeenEntrySchema.safeParse({ ...d, reason: undefined }).success).toBe(false);
    expect(SeenEntrySchema.safeParse({ ...d, slug: 'good-post' }).success).toBe(false);
  });
  it('a deferred entry may be rewritten to picked or skipped (no check forbids it)', () => {
    const key = 'https://a.com/x';
    const before = { [key]: { company: 'x', seenAt: '2026-10-20', decision: 'deferred', reason: 'cap' } };
    const toPicked = { [key]: picked };
    const toSkipped = { [key]: { company: 'x', seenAt: '2026-10-21', decision: 'skipped', reason: 'dup' } };
    for (const seen of [before, toPicked, toSkipped]) expect(SeenSchema.safeParse(seen).success).toBe(true);
  });
  it('rejects unknown decision and unknown keys', () => {
    expect(SeenEntrySchema.safeParse({ ...picked, decision: 'maybe' }).success).toBe(false);
    expect(SeenEntrySchema.safeParse({ ...picked, extra: 1 }).success).toBe(false);
  });
  it('SeenSchema is a record of entries', () => {
    expect(SeenSchema.safeParse({ 'https://a.com/x': picked }).success).toBe(true);
    expect(SeenSchema.safeParse({ 'https://a.com/x': { ...picked, decision: 'maybe' } }).success).toBe(false);
  });
});
