import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cpSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { listPosts, _resetListPostsCache } from '@/lib/content/load';
import { loadVocab } from '@/lib/content/vocab';
import { fold } from '@/lib/fold';
import { searchRecords } from '@/lib/search-records';

const FIXTURE = 'tests/fixtures/posts/good-post';
const TITLE = 'Discord chuyển kho tin nhắn từ Cassandra sang ScyllaDB';

let tmp: string;
beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), 'search-records-'));
  _resetListPostsCache();
  cpSync(FIXTURE, path.join(tmp, 'good-post'), { recursive: true });
  const vi = path.join(tmp, 'vi-only');
  cpSync(FIXTURE, vi, { recursive: true });
  rmSync(path.join(vi, 'en.mdx'));
  const meta = JSON.parse(readFileSync(path.join(vi, 'post.json'), 'utf8'));
  writeFileSync(path.join(vi, 'post.json'), JSON.stringify({ ...meta, slug: 'vi-only' }));
});
afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
  _resetListPostsCache();
});

const records = () => searchRecords(listPosts(tmp), loadVocab('content'));

describe('searchRecords', () => {
  it('emits one record per post and locale; vi-only post is absent from en', () => {
    const r = records();
    expect(r).toHaveLength(3);
    expect(r.filter((x) => x.language === 'en').map((x) => x.url)).toEqual(['/en/posts/good-post']);
    expect(r.filter((x) => x.language === 'vi').map((x) => x.url).sort()).toEqual([
      '/vi/posts/good-post',
      '/vi/posts/vi-only',
    ]);
  });

  it('includes the accented title and its folded copy in content', () => {
    const r = records().find((x) => x.url === '/vi/posts/good-post')!;
    expect(r.content).toContain(TITLE);
    expect(r.content).toContain(fold(TITLE));
    expect(r.content).toContain('Discord chuyen kho tin nhan');
  });

  it('carries exact meta', () => {
    const r = records().find((x) => x.url === '/vi/posts/good-post')!;
    expect(r.meta).toEqual({
      title: TITLE,
      summary: expect.stringMatching(/^Discord thay 177 node Cassandra/),
      company: 'Discord',
      companyId: 'discord',
      keyValue: '177 → 72',
      keyLabel: 'Số node database, Cassandra sang ScyllaDB',
    });
  });

  it('keeps prose and drops fenced code', () => {
    const dir = path.join(tmp, 'good-post');
    const f = path.join(dir, 'vi.mdx');
    writeFileSync(f, readFileSync(f, 'utf8') + '\n\nĐoạn văn giữ lại.\n\n```js\nconst secretFence = 1;\n```\n');
    _resetListPostsCache();
    const r = records().find((x) => x.url === '/vi/posts/good-post')!;
    expect(r.content).toContain('Đoạn văn giữ lại.');
    expect(r.content).not.toContain('secretFence');
  });
});
