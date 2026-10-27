import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { readRawPost } from '@/lib/content/load';
import { CHECKLIST } from '@/lib/pipeline/checklist';
import { ledgerCounts, postToPrPost, prBody } from '@/lib/pipeline/pr-body';

const GOOD = 'tests/fixtures/posts/good-post';
const template = readFileSync('.github/pull_request_template.md', 'utf8');

describe('CHECKLIST', () => {
  it('matches the PR template', () => {
    expect(CHECKLIST.length).toBe(10);
    expect(CHECKLIST[0]).toBe('Functional and non-functional requirements stated.');
    const lines = template.split('\n');
    for (const item of CHECKLIST) expect(lines).toContain(`- [ ] ${item}`);
    const section = template.split('## Review checklist')[1].split('\n## ')[0];
    expect(section.split('\n').filter((l) => l.startsWith('- [ ] ')).length).toBe(CHECKLIST.length);
  });
});

describe('prBody', () => {
  it('renders a good post', () => {
    const body = prBody([postToPrPost(readRawPost(GOOD))], { picked: 1, skipped: 0, deferred: 0, rejected: 0 });
    expect(body).toContain('### good-post');
    expect(body.split('\n').filter((l) => l.startsWith('- [ ] ')).length).toBe(10);
    expect(body).toContain(
      '- `S1` (blog): How Discord Stores Trillions of Messages, https://discord.com/blog/how-discord-stores-trillions-of-messages, locator: —',
    );
    expect(body).toContain('Ledger: 1 picked, 0 skipped, 0 deferred, 0 rejected.');
    const idx = ['## Summary', '## Review checklist', '## Sources', '## Lessons omitted?', '## Mermaid'].map((h) =>
      body.indexOf(h),
    );
    expect(idx.every((i) => i >= 0)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
  });
  it('handles no posts', () => {
    const body = prBody([], { picked: 0, skipped: 4, deferred: 2, rejected: 0 });
    expect(body).toContain('No picks this run.');
    expect(body).toContain('Ledger: 0 picked, 4 skipped, 2 deferred, 0 rejected.');
    expect(body).not.toContain('## Review checklist');
  });
  it('flags omitted lessons', () => {
    const dir = path.join(mkdtempSync(path.join(os.tmpdir(), 'prb-')), 'good-post');
    cpSync(GOOD, dir, { recursive: true });
    const f = path.join(dir, 'en.mdx');
    const src = readFileSync(f, 'utf8');
    writeFileSync(f, src.replace(/^lessons:\n(?:  - .*\n)+/m, ''));
    const body = prBody([postToPrPost(readRawPost(dir))], { picked: 1, skipped: 0, deferred: 0, rejected: 0 });
    expect(body).toContain('omitted in en');
  });
});

describe('ledgerCounts', () => {
  it('counts additions only', () => {
    const a = { company: 'a', seenAt: '2026-10-01', decision: 'picked' as const, slug: 'a' };
    const sk = (c: string) => ({ company: c, seenAt: '2026-10-01', decision: 'skipped' as const, reason: 'r' });
    expect(ledgerCounts({ a, b: sk('b'), c: sk('c') }, { a })).toEqual({ picked: 0, skipped: 2, deferred: 0, rejected: 0 });
  });
  it('reports deferred separately', () => {
    const df = { company: 'd', seenAt: '2026-10-01', decision: 'deferred' as const, reason: 'cap' };
    expect(ledgerCounts({ x: df, y: df }, {})).toEqual({ picked: 0, skipped: 0, deferred: 2, rejected: 0 });
  });
});
