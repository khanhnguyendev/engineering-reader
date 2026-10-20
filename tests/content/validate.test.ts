import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readRawPost } from '@/lib/content/load';
import { loadVocab } from '@/lib/content/vocab';
import { validatePost, validateAll, zodIssuesToFindings, type Finding } from '@/lib/content/validate';

const GOOD = path.resolve(import.meta.dirname, '../fixtures/posts/good-post');
const vocab = loadVocab();
const TODAY = '2026-10-21';

let tmp: string;
let n = 0;
beforeAll(() => {
  tmp = mkdtempSync(path.join(tmpdir(), 'validate-test-'));
});
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

function fresh(): string {
  const dir = path.join(tmp, `p${n++}`, 'good-post');
  cpSync(GOOD, dir, { recursive: true });
  return dir;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function editJson(dir: string, fn: (j: Record<string, any>) => void) {
  const f = path.join(dir, 'post.json');
  const j = JSON.parse(readFileSync(f, 'utf8'));
  fn(j);
  writeFileSync(f, JSON.stringify(j, null, 2));
}
function editMdx(dir: string, locale: string, fn: (s: string) => string) {
  const f = path.join(dir, `${locale}.mdx`);
  writeFileSync(f, fn(readFileSync(f, 'utf8')));
}
function run(dir: string, today = TODAY): Finding[] {
  return validatePost(readRawPost(dir), vocab, { today });
}
const errs = (fs: Finding[]) => fs.filter((f) => f.level === 'error');
const rules = (fs: Finding[]) => errs(fs).map((f) => f.rule);

describe('validatePost', () => {
  it('good-post has zero errors', () => {
    expect(errs(run(GOOD))).toEqual([]);
  });

  it('enum: unknown topic, company, tag, series', () => {
    let d = fresh();
    editJson(d, (j) => (j.topic = 'performance'));
    expect(rules(run(d))).toContain('enum');
    d = fresh();
    editJson(d, (j) => (j.company = 'nope'));
    expect(rules(run(d))).toContain('enum');
    d = fresh();
    editJson(d, (j) => (j.tags[0] = 'not-a-tag'));
    expect(rules(run(d))).toContain('enum');
    d = fresh();
    editJson(d, (j) => (j.series = 'no-such-series'));
    expect(rules(run(d))).toContain('enum');
  });

  it('locator: talk without locator', () => {
    const d = fresh();
    editJson(d, (j) => {
      j.sources[0].type = 'talk';
      j.sources[0].url = 'https://www.youtube.com/watch?v=x';
    });
    expect(rules(run(d))).toContain('locator');
  });

  it('locator: reported once alongside another schema error', () => {
    const d = fresh();
    editJson(d, (j) => {
      j.topic = 'performance';
      j.sources[0].type = 'talk';
      j.sources[0].url = 'https://www.youtube.com/watch?v=x';
    });
    const fs = run(d);
    expect(rules(fs)).toContain('enum');
    expect(rules(fs)).toContain('locator');
    expect(fs.filter((x) => x.rule === 'locator')).toHaveLength(1);
  });

  it('CRLF + BOM copy of good-post has zero errors', () => {
    const d = fresh();
    for (const f of ['vi.mdx', 'en.mdx', 'post.json']) {
      const p = path.join(d, f);
      writeFileSync(p, '\uFEFF' + readFileSync(p, 'utf8').replace(/\n/g, '\r\n'));
    }
    expect(errs(run(d))).toEqual([]);
  });

  it('summary-length: 161 code points', () => {
    const d = fresh();
    editMdx(d, 'en', (s) => s.replace(/^summary: ".*"$/m, `summary: "${'a'.repeat(161)}"`));
    expect(rules(run(d))).toContain('summary-length');
  });

  it('schema: unknown key, malformed json', () => {
    let d = fresh();
    editJson(d, (j) => (j.bogus = 1));
    expect(rules(run(d))).toContain('schema');
    d = fresh();
    writeFileSync(path.join(d, 'post.json'), '{ not json');
    const f = run(d).find((x) => x.rule === 'schema');
    expect(f?.file).toBe('post.json');
  });

  it('labels: keyNumberLabels must match key number ids', () => {
    const d = fresh();
    editMdx(d, 'vi', (s) => s.replace(/^ {2}migration:/m, '  extra:'));
    const f = run(d).find((x) => x.rule === 'labels');
    expect(f).toBeDefined();
    expect(f!.file).toBe('vi.mdx');
  });

  it('refs: body ref to unknown source [S3]', () => {
    const d = fresh();
    editMdx(d, 'en', (s) => s + '\nExtra claim [S3].\n');
    const f = run(d).find((x) => x.rule === 'refs');
    expect(f?.message).toContain('S3');
  });

  it('refs: keyNumber ref S9 names the id', () => {
    const d = fresh();
    editJson(d, (j) => (j.keyNumbers[0].ref = 'S9'));
    const f = run(d).find((x) => x.rule === 'refs' && x.message.includes('S9'));
    expect(f).toBeDefined();
  });

  it('refs: unreferenced source id', () => {
    const d = fresh();
    editJson(d, (j) => {
      j.sources.push({
        id: 'S2', type: 'blog', title: 'T', authors: [], publishedAt: '2023-03-06',
        url: 'https://discord.com/blog/other', accessedAt: '2026-10-21', locator: null,
      });
    });
    const f = run(d).find((x) => x.rule === 'refs');
    expect(f?.message).toContain('S2');
  });

  it('source-host: foreign host fails, utm params on company host pass', () => {
    let d = fresh();
    editJson(d, (j) => (j.sources[0].url = 'https://medium.com/@x/y'));
    expect(rules(run(d))).toContain('source-host');
    d = fresh();
    editJson(d, (j) => (j.sources[0].url += '?utm_source=x&utm_medium=y'));
    expect(rules(run(d))).not.toContain('source-host');
  });

  it('source-host: allowed host from source-hosts.json passes', () => {
    const d = fresh();
    editJson(d, (j) => {
      j.sources[0].type = 'paper';
      j.sources[0].locator = 'p. 1';
      j.sources[0].url = 'https://arxiv.org/abs/1';
    });
    expect(rules(run(d))).not.toContain('source-host');
  });

  it('image-external: markdown and html', () => {
    let d = fresh();
    editMdx(d, 'en', (s) => s + '\n![diagram](https://evil.com/a.png)\n');
    expect(rules(run(d))).toContain('image-external');
    d = fresh();
    editMdx(d, 'vi', (s) => s + '\n<img src="http://evil.com/a.png" alt="x" />\n');
    expect(rules(run(d))).toContain('image-external');
    d = fresh();
    editMdx(d, 'en', (s) => s + '\n![diagram](./a.png)\n');
    expect(rules(run(d))).not.toContain('image-external');
  });

  it('asset-size: file over 300 KB and dir over 2 MB', () => {
    let d = fresh();
    writeFileSync(path.join(d, 'big.png'), Buffer.alloc(301 * 1024));
    expect(rules(run(d))).toContain('asset-size');
    d = fresh();
    for (let i = 0; i < 8; i++) writeFileSync(path.join(d, `a${i}.png`), Buffer.alloc(290 * 1024));
    const f = run(d).filter((x) => x.rule === 'asset-size');
    expect(f.some((x) => x.message.includes('2 MB'))).toBe(true);
  });

  it('alt-text: empty alt', () => {
    const d = fresh();
    editMdx(d, 'en', (s) => s + '\n![](./a.png)\n');
    expect(rules(run(d))).toContain('alt-text');
  });

  it('mermaid-count: differs across locales', () => {
    const d = fresh();
    editMdx(d, 'en', (s) => s + '\n```mermaid\ngraph TD; A-->B\n```\n');
    expect(rules(run(d))).toContain('mermaid-count');
  });

  it('reading-time: deep layer cut to 300 words includes measured value', () => {
    const d = fresh();
    editMdx(d, 'en', (s) => {
      const end = s.indexOf('\n---', 4) + 4;
      return s.slice(0, end) + '\n' + Array(300).fill('word').join(' ') + '\n';
    });
    const f = run(d).find((x) => x.rule === 'reading-time');
    expect(f).toBeDefined();
    expect(f!.message).toContain('en deep layer is 2 min');
    expect(f!.file).toBe('en.mdx');
  });

  it('locales: missing locale file errors; draft is fine', () => {
    let d = fresh();
    rmSync(path.join(d, 'en.mdx'));
    expect(rules(run(d))).toContain('locales');
    d = fresh();
    editMdx(d, 'en', (s) => s.replace('---\n', '---\ndraft: true\n'));
    expect(rules(run(d))).not.toContain('locales');
  });

  it('published-at: 4 days old warns, 3 days does not', () => {
    const d = fresh();
    const w = run(d, '2026-10-25').find((x) => x.rule === 'published-at');
    expect(w?.level).toBe('warn');
    expect(run(d, '2026-10-24').find((x) => x.rule === 'published-at')).toBeUndefined();
  });

  it('lessons-omitted: warns when a locale has no lessons', () => {
    const d = fresh();
    editMdx(d, 'en', (s) => s.replace(/^lessons:\n(?: {2}- .*\n)+/m, ''));
    const w = run(d).find((x) => x.rule === 'lessons-omitted');
    expect(w?.level).toBe('warn');
  });
});

describe('zodIssuesToFindings', () => {
  it('maps paths to rules', () => {
    const mk = (path: (string | number)[]) =>
      ({ code: 'custom', path, message: 'm', file: 'post.json' }) as never;
    const out = zodIssuesToFindings(
      [mk(['topic']), mk(['sources', 0, 'locator']), mk(['summary']), mk(['title'])],
      's',
    );
    expect(out.map((f) => f.rule)).toEqual(['enum', 'locator', 'summary-length', 'schema']);
  });
});

describe('validateAll', () => {
  it('aggregates, flags missing post.json, sorts, and ok reflects errors', () => {
    const root = path.join(tmp, 'all');
    mkdirSync(root);
    cpSync(GOOD, path.join(root, 'good-post'), { recursive: true });
    mkdirSync(path.join(root, 'orphan'));
    writeFileSync(path.join(root, 'orphan', 'en.mdx'), '---\n---\n');
    const r = validateAll(root, vocab, { today: TODAY });
    expect(r.ok).toBe(false);
    expect(r.findings.some((f) => f.slug === 'orphan' && f.rule === 'schema' && f.message.includes('post.json missing'))).toBe(true);
    expect(r.findings.filter((f) => f.slug === 'good-post' && f.level === 'error')).toEqual([]);
  });
  it('empty or missing root is ok', () => {
    expect(validateAll(path.join(tmp, 'nope'), vocab, { today: TODAY }).ok).toBe(true);
  });
});
