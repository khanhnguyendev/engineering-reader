import { describe, it, expect } from 'vitest';
import { PostJsonSchema, LocaleFrontmatterSchema } from '@/lib/content/schema';

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
    { id: 'migration', value: '9 days', ref: 'S1' },
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
