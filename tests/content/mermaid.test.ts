import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readRawPost } from '@/lib/content/load';
import {
  MERMAID_THEME,
  SENTINELS,
  hashBlock,
  svgName,
  readSvgHash,
  postProcessSvg,
  planRenders,
  leftoverColors,
} from '@/lib/content/mermaid';

const GOOD = path.resolve(import.meta.dirname, '../fixtures/posts/good-post');

let tmp: string;
beforeAll(() => {
  tmp = mkdtempSync(path.join(tmpdir(), 'mermaid-test-'));
});
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe('hashBlock', () => {
  it('is stable, 12 chars, and depends on source', () => {
    expect(hashBlock('graph TD\nA-->B')).toBe(hashBlock('graph TD\nA-->B'));
    expect(hashBlock('graph TD\nA-->B')).toMatch(/^[0-9a-f]{12}$/);
    expect(hashBlock('graph TD\nA-->C')).not.toBe(hashBlock('graph TD\nA-->B'));
  });
  it('is bound to the sentinels', () => {
    const before = hashBlock('x');
    const orig = SENTINELS['#010101'];
    SENTINELS['#010101'] = 'var(--other)';
    try {
      expect(hashBlock('x')).not.toBe(before);
    } finally {
      SENTINELS['#010101'] = orig;
    }
  });
  it('is bound to the theme', () => {
    const before = hashBlock('x');
    const orig = MERMAID_THEME.themeVariables.primaryColor;
    MERMAID_THEME.themeVariables.primaryColor = '#0a0a0a';
    try {
      expect(hashBlock('x')).not.toBe(before);
    } finally {
      MERMAID_THEME.themeVariables.primaryColor = orig;
    }
  });
  it('mermaid.config.json equals MERMAID_THEME', () => {
    const json = JSON.parse(readFileSync(path.resolve(import.meta.dirname, '../../mermaid.config.json'), 'utf8'));
    expect(json).toEqual(MERMAID_THEME);
  });
});

describe('svg helpers', () => {
  it('svgName', () => expect(svgName('vi', 0)).toBe('vi-diagram-1.svg'));
  it('readSvgHash reads line 1', () => {
    expect(readSvgHash('<!-- mermaid:abc123def456 -->\n<svg/>')).toBe('abc123def456');
    expect(readSvgHash('<svg/>')).toBeUndefined();
  });
  it('postProcessSvg replaces sentinels and sets id', () => {
    const out = postProcessSvg('<svg id="x" fill="#010101" stroke="#0A0A0A"><g style="fill:#050505"/></svg>', { id: 'p-vi-1' });
    expect(out).toContain('var(--panel)');
    expect(out).not.toContain('#010101');
    expect(out).toContain('fill:transparent');
    expect(out).toContain('id="p-vi-1"');
    expect(Object.keys(SENTINELS)).toHaveLength(5);
  });
  it('postProcessSvg converts sentinel rgba() to color-mix', () => {
    const out = postProcessSvg('<svg id="a"><style>.x{background-color:rgba(4, 4, 4, 0.5);color:rgba(2,2,2,1)}.y{c:rgba(9,9,9,0.5)}</style></svg>', { id: 'a' });
    expect(out).toContain('color-mix(in srgb, var(--panel-2) 50%, transparent)');
    expect(out).toContain('color-mix(in srgb, var(--ink) 100%, transparent)');
    expect(out).toContain('rgba(9,9,9,0.5)');
  });
  it('postProcessSvg adds a missing id and replaces uppercase hex', () => {
    const out = postProcessSvg('<svg width="1"><path fill="#030303"/></svg>', { id: 'a' });
    expect(out).toContain('<svg id="a" width="1">');
    const up = postProcessSvg('<svg id="a"><path fill="#0A0A0A"/><path fill="#020202"/></svg>', { id: 'a' });
    expect(up).toContain('var(--ink)');
  });
});

describe('leftoverColors', () => {
  it('reports distinct non-sentinel colours only', () => {
    const svg = '<svg><path fill="#ABCDEF"/><path stroke="#abcdef" style="fill:rgb(1, 2, 3)"/><g fill="var(--ink)"/>&#123;</svg>';
    expect(leftoverColors(svg)).toEqual(['#ABCDEF', '#abcdef', 'rgb(1, 2, 3)']);
    expect(leftoverColors('<svg fill="var(--panel)"/>')).toEqual([]);
  });
  it('ignores colours inside <style> and <filter>', () => {
    const svg =
      '<svg><style>.a{fill:#000;x:rgba(1,2,3,1)}</style><filter id="f"><feDropShadow flood-color="#000000"/></filter><path fill="#123456"/></svg>';
    expect(leftoverColors(svg)).toEqual(['#123456']);
  });
});

describe('planRenders', () => {
  it('missing -> fresh -> stale', () => {
    const dir = path.join(tmp, 'plan-post');
    cpSync(GOOD, dir, { recursive: true });
    const plan1 = planRenders(readRawPost(dir));
    expect(plan1.length).toBeGreaterThan(0);
    expect(plan1.every((p) => p.status === 'missing')).toBe(true);
    for (const p of plan1) {
      expect(p.file).toBe(path.join(dir, svgName(p.locale, p.index)));
      writeFileSync(p.file, `<!-- mermaid:${hashBlock(p.src)} -->\n<svg/>`);
    }
    expect(planRenders(readRawPost(dir)).every((p) => p.status === 'fresh')).toBe(true);
    const vi = path.join(dir, 'vi.mdx');
    writeFileSync(vi, readFileSync(vi, 'utf8').replace(/```mermaid\n/, '```mermaid\n%% changed\n'));
    const plan3 = planRenders(readRawPost(dir));
    expect(plan3.find((p) => p.locale === 'vi')?.status).toBe('stale');
    expect(plan3.find((p) => p.locale === 'en')?.status).toBe('fresh');
  });
});
