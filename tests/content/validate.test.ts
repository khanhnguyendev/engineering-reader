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

  it('enum: post slug missing from its series slugs', () => {
    const d = fresh();
    editJson(d, (j) => (j.series = 's'));
    const v = { ...vocab, series: { s: { slugs: ['other'], vi: 'S', en: 'S' } } };
    const fs = validatePost(readRawPost(d), v, { today: TODAY });
    expect(errs(fs).filter((f) => f.rule === 'enum' && /not listed in series/.test(f.message))).toHaveLength(1);
    const ok = { ...vocab, series: { s: { slugs: ['good-post'], vi: 'S', en: 'S' } } };
    expect(errs(validatePost(readRawPost(d), ok, { today: TODAY }))).toEqual([]);
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

  it('schema: slug must match the folder name', () => {
    const dir = path.join(tmp, `p${n++}`, 'other-folder');
    cpSync(GOOD, dir, { recursive: true });
    const f = errs(run(dir)).filter((x) => x.rule === 'schema');
    expect(f).toHaveLength(1);
    expect(f[0].message).toContain('does not match folder name "other-folder"');
    expect(errs(run(fresh()))).toEqual([]);
  });

  it('svg-unsafe: script, event handler and javascript: URL are rejected', () => {
    const svg = (inner: string) =>
      `<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div>label, only = fine</div></foreignObject>${inner}</svg>`;
    let d = fresh();
    mkdirSync(path.join(d, 'diagrams'), { recursive: true });
    writeFileSync(path.join(d, 'diagrams', 'ok.svg'), svg('<rect width="1" height="1"/>'));
    expect(rules(run(d))).not.toContain('svg-unsafe');
    for (const bad of [
      '<script>alert(1)</script>',
      '<rect onload="alert(1)"/>',
      '<rect ONCLICK = "x()"/>',
      '<a href="javascript:alert(1)"><text>x</text></a>',
    ]) {
      d = fresh();
      writeFileSync(path.join(d, 'bad.svg'), svg(bad));
      const f = errs(run(d)).filter((x) => x.rule === 'svg-unsafe');
      expect(f, bad).toHaveLength(1);
      expect(f[0].file).toBe('bad.svg');
    }
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

describe('key-number-words', () => {
  const setValue = (v: string) => {
    const d = fresh();
    editJson(d, (j) => (j.keyNumbers[2].value = v));
    return run(d);
  };
  it.each(['9 days', '3 ngày', '177 nodes', 'p99 fast'])('rejects %s', (v) => {
    const fs = setValue(v);
    expect(rules(fs)).toContain('key-number-words');
    const f = fs.find((x) => x.rule === 'key-number-words')!;
    const word = v === '9 days' ? 'days' : v === '3 ngày' ? 'ngày' : v === '177 nodes' ? 'nodes' : 'fast';
    expect(f.message).toContain(`"${word}"`);
  });
  it.each(['9 d', '≈41 h', '4 / 10 min', '≈10%', '177 → 72', 'p99 40–125 → 15 ms', '99.99% × 10 → ~99.9%', '30M req/s', '1T'])(
    'accepts %s',
    (v) => {
      expect(rules(setValue(v))).not.toContain('key-number-words');
    },
  );
  it('live posts have no key-number-words finding', () => {
    const r = validateAll(path.resolve(import.meta.dirname, '../../content/posts'), vocab, { today: TODAY });
    expect(r.findings.filter((f) => f.rule === 'key-number-words')).toEqual([]);
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

  it('featured: a featured slug with no post folder is an error', () => {
    const root = path.join(tmp, 'featured');
    mkdirSync(root);
    cpSync(GOOD, path.join(root, 'good-post'), { recursive: true });
    const ok = validateAll(root, { ...vocab, featured: ['good-post'] }, { today: TODAY });
    expect(ok.findings.filter((f) => f.rule === 'featured')).toEqual([]);
    const bad = validateAll(root, { ...vocab, featured: ['good-post', 'ghost'] }, { today: TODAY });
    expect(bad.ok).toBe(false);
    const fs = bad.findings.filter((f) => f.rule === 'featured');
    expect(fs).toHaveLength(1);
    expect(fs[0]).toMatchObject({ level: 'error', slug: 'ghost', message: 'featured slug ghost has no post' });
  });

  it('featured: a slug listed twice in featured.json is an error', () => {
    const root = path.join(tmp, 'featured-dup');
    mkdirSync(root);
    cpSync(GOOD, path.join(root, 'good-post'), { recursive: true });
    const r = validateAll(root, { ...vocab, featured: ['good-post', 'good-post'] }, { today: TODAY });
    expect(r.ok).toBe(false);
    const fs = r.findings.filter((f) => f.rule === 'featured');
    expect(fs).toHaveLength(1);
    expect(fs[0]).toMatchObject({
      level: 'error',
      slug: 'good-post',
      file: 'featured.json',
      message: 'featured slug good-post is listed more than once',
    });
  });

  it('enum: every slug listed in series.json must exist as a post folder', () => {
    const root = path.join(tmp, 'series');
    mkdirSync(root);
    cpSync(GOOD, path.join(root, 'good-post'), { recursive: true });
    const series = { s: { slugs: ['good-post', 'ghost'], vi: 'S', en: 'S' } };
    const r = validateAll(root, { ...vocab, series }, { today: TODAY });
    expect(r.ok).toBe(false);
    const fs = r.findings.filter((f) => f.rule === 'enum' && f.slug === 'ghost');
    expect(fs).toHaveLength(1);
    expect(fs[0].message).toMatch(/series "s".*ghost/);
    const ok = validateAll(root, { ...vocab, series: { s: { slugs: ['good-post'], vi: 'S', en: 'S' } } }, { today: TODAY });
    expect(ok.findings.filter((f) => f.rule === 'enum')).toEqual([]);
  });
});

describe('seen', () => {
  const entry = { company: 'discord', seenAt: '2026-10-21', decision: 'picked', slug: 'good-post' };
  const KEY = 'https://discord.com/blog/x';
  // Own nested root per test: <tmp>/s<n>/posts with <tmp>/s<n>/seen.json beside it.
  function seenRoot(seen: string | object | null): string {
    const base = path.join(tmp, `s${n++}`);
    const root = path.join(base, 'posts');
    mkdirSync(root, { recursive: true });
    cpSync(GOOD, path.join(root, 'good-post'), { recursive: true });
    if (seen !== null) {
      writeFileSync(path.join(base, 'seen.json'), typeof seen === 'string' ? seen : JSON.stringify(seen));
    }
    return root;
  }
  const seenFindings = (root: string) =>
    validateAll(root, vocab, { today: TODAY }).findings.filter((f) => f.rule === 'seen');

  it('unnormalized key is an error naming the normalized form', () => {
    const fs = seenFindings(seenRoot({ 'https://Discord.com/blog/x/?utm_source=a': entry }));
    expect(fs).toHaveLength(1);
    expect(fs[0].level).toBe('error');
    expect(fs[0].slug).toBe('seen');
    expect(fs[0].file).toBe('seen.json');
    expect(fs[0].message).toContain('https://discord.com/blog/x');
  });
  it('unknown company is an error', () => {
    expect(seenFindings(seenRoot({ [KEY]: { ...entry, company: 'nope' } }))).toHaveLength(1);
  });
  it('picked slug with no post is an error', () => {
    expect(seenFindings(seenRoot({ [KEY]: { ...entry, slug: 'missing-post' } }))).toHaveLength(1);
  });
  it('picked slug with a post and normalized key is clean', () => {
    expect(seenFindings(seenRoot({ [KEY]: entry }))).toEqual([]);
  });
  it('non-URL key is a finding, not a crash', () => {
    expect(seenFindings(seenRoot({ 'not a url': entry }))).not.toHaveLength(0);
  });
  it('malformed JSON is an error', () => {
    expect(seenFindings(seenRoot('{ nope'))).toHaveLength(1);
  });
  it('schema violations are seen errors', () => {
    expect(seenFindings(seenRoot({ [KEY]: { ...entry, decision: 'maybe' } }))).not.toHaveLength(0);
  });
  it('absent seen.json is no finding', () => {
    expect(seenFindings(seenRoot(null))).toEqual([]);
  });
  it('live content/seen.json is clean', () => {
    const live = path.resolve(import.meta.dirname, '../../content/posts');
    expect(seenFindings(live)).toEqual([]);
  });
});
