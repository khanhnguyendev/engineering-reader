import { afterEach, describe, expect, it, vi } from 'vitest';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { PostRecord } from '@/lib/content/load';
import type { Vocab } from '@/lib/content/vocab';
import vi_ from '@/dictionaries/vi.json';
import en_ from '@/dictionaries/en.json';
import { llmsTxt, postMarkdown } from '@/lib/markdown';

vi.mock('server-only', () => ({}));
afterEach(() => vi.unstubAllEnvs());

const SITE = 'https://example.test';
const dicts = { vi: vi_, en: en_ };
const vocab = {
  companies: [{ slug: 'discord', name: 'Discord' }],
  topics: [{ slug: 'data', vi: 'Dữ liệu', en: 'Data' }],
  tags: [],
  series: {},
  sourceHosts: [],
  featured: [],
} as unknown as Vocab;

const BODY = '## Vấn đề bắt đầu từ đâu\n\nVăn bản [S1].\n\n```mermaid\nflowchart LR\n  A --> B\n```\n';

function doc(title: string, summary: string, body = BODY, lessons = true) {
  return {
    frontmatter: {
      title,
      summary,
      tldr: ['tldr một', 'tldr hai', 'tldr ba'],
      keyNumberLabels: { k1: 'Số node' },
      smallTeam: ['nhỏ một', 'nhỏ hai'],
      ...(lessons ? { lessons: ['bài học một', 'bài học hai'] } : {}),
    },
    body,
    readingTime: { deep: 6, whole: 8 },
    refs: [],
    mermaidBlocks: [],
  };
}
function post(slug: string, publishedAt: string, locales: ('vi' | 'en')[], lessons = true): PostRecord {
  return {
    slug,
    dir: slug,
    meta: {
      slug,
      company: 'discord',
      topic: 'data',
      publishedAt,
      keyNumbers: [{ id: 'k1', value: '177 → 72', ref: 'S1' }],
      sources: [
        { id: 'S1', type: 'blog', title: 'Nguồn một', authors: ['Bo Ingram', 'A B'], publishedAt: '2023-03-06', url: 'https://a.test/1', accessedAt: '2026-10-21', locator: null },
        { id: 'S2', type: 'talk', title: 'Nguồn hai', authors: [], publishedAt: '2023-04-01', url: 'https://a.test/2', accessedAt: '2026-10-21', locator: '12:30' },
      ],
    },
    locales: Object.fromEntries(locales.map((l) => [l, doc(`Tiêu đề ${slug} ${l}`, `Tóm tắt ${slug} ${l}`, BODY, lessons)])),
  } as unknown as PostRecord;
}

describe('postMarkdown', () => {
  const md = postMarkdown(post('p1', '2026-10-21', ['vi', 'en']), 'vi', vocab, dicts.vi, SITE);
  const at = (s: string) => md.indexOf(s);

  it('starts with the title as an H1 and then the summary quote', () => {
    expect(md.startsWith('# Tiêu đề p1 vi\n')).toBe(true);
    expect(md).toContain('> Tóm tắt p1 vi');
  });

  it('follows spec order: title, summary, key numbers, TL;DR, small team, divider, body, sources', () => {
    const order = [
      '# Tiêu đề',
      '> Tóm tắt',
      'Discord · Dữ liệu · 2026-10-21',
      `## ${dicts.vi.post.keyNumbers}`,
      `## ${dicts.vi.post.tldr}`,
      `## ${dicts.vi.post.smallTeam}`,
      '\n---\n',
      '## Vấn đề bắt đầu từ đâu',
      `## ${dicts.vi.post.lessons}`,
      `## ${dicts.vi.post.sources}`,
    ].map(at);
    expect(order.every((n) => n >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('has the metadata line with an absolute html url', () => {
    expect(md).toContain(`Discord · Dữ liệu · 2026-10-21 · ${SITE}/vi/posts/p1`);
  });

  it('formats key numbers, sources and the AI line', () => {
    expect(md).toContain('- **177 → 72** Số node [S1]');
    expect(md).toContain('- [S1] Nguồn một, Bo Ingram, A B, 2023-03-06. https://a.test/1');
    expect(md).toContain('- [S2] Nguồn hai, 2023-04-01. https://a.test/2 (12:30)');
    expect(md.trimEnd().endsWith(dicts.vi.post.aiLine)).toBe(true);
  });

  it('keeps mermaid fences verbatim and uses locale headings in en', () => {
    expect(md).toContain('```mermaid\nflowchart LR\n  A --> B\n```');
    const en = postMarkdown(post('p1', '2026-10-21', ['vi', 'en']), 'en', vocab, dicts.en, SITE);
    expect(en).toContain(`## ${dicts.en.post.sources}`);
    expect(en).not.toContain(`## ${dicts.vi.post.sources}`);
  });

  it('omits the lessons heading when the post has none', () => {
    const none = postMarkdown(post('p2', '2026-10-21', ['vi'], false), 'vi', vocab, dicts.vi, SITE);
    expect(none).not.toContain(`## ${dicts.vi.post.lessons}`);
  });

  it('is NFC-normalised', () => {
    expect(md).toBe(md.normalize('NFC'));
    const nfd = post('p3', '2026-10-21', ['vi']);
    nfd.locales.vi!.frontmatter.title = 'Tiêu đề'.normalize('NFD');
    const out = postMarkdown(nfd, 'vi', vocab, dicts.vi, SITE);
    expect(out).toBe(out.normalize('NFC'));
  });
});

describe('llmsTxt', () => {
  const posts = [
    post('old', '2026-10-01', ['vi', 'en']),
    post('vi-only', '2026-10-05', ['vi']),
    post('new', '2026-10-09', ['vi', 'en']),
  ];
  const txt = llmsTxt(posts, vocab, dicts, SITE);
  const vi = txt.slice(txt.indexOf('## Tiếng Việt'), txt.indexOf('## English'));
  const en = txt.slice(txt.indexOf('## English'), txt.indexOf('## Optional'));

  it('has the header, tagline in both languages and the intro', () => {
    expect(txt.startsWith(`# ${dicts.vi.site.name}\n`)).toBe(true);
    expect(txt).toContain(`> ${dicts.vi.site.tagline} / ${dicts.en.site.tagline.replace(/\u00a0/g, ' ')}`);
    expect(txt).not.toContain('\u00a0');
    expect(txt).toContain(dicts.vi.llms.intro);
    expect(txt).toContain(dicts.en.llms.intro);
  });

  it('lists the vi-only post under Tiếng Việt only, newest first', () => {
    expect(vi).toContain('/vi/posts/vi-only.md');
    expect(en).not.toContain('vi-only');
    expect(txt.indexOf('/vi/posts/new.md')).toBeLessThan(txt.indexOf('/vi/posts/vi-only.md'));
    expect(txt.indexOf('/vi/posts/vi-only.md')).toBeLessThan(txt.indexOf('/vi/posts/old.md'));
    expect(en).toContain(`- [Tiêu đề new en](${SITE}/en/posts/new.md): Tóm tắt new en`);
  });

  it('every post link is absolute and ends in .md', () => {
    const links = [...txt.matchAll(/\]\((\S+?)\)/g)].map((m) => m[1]);
    expect(links.length).toBeGreaterThan(0);
    for (const l of links) expect(l.startsWith(SITE)).toBe(true);
    const postLinks = links.filter((l) => l.includes('/posts/'));
    expect(postLinks).toHaveLength(5);
    for (const l of postLinks) expect(l.endsWith('.md')).toBe(true);
  });

  it('has an Optional section with both feeds and the sitemap', () => {
    const opt = txt.slice(txt.indexOf('## Optional'));
    expect(opt).toContain(`${SITE}/vi/feed.xml`);
    expect(opt).toContain(`${SITE}/en/feed.xml`);
    expect(opt).toContain(`${SITE}/sitemap.xml`);
  });
});

describe('md route and llms route', () => {
  async function load() {
    const root = mkdtempSync(path.join(tmpdir(), 'md-'));
    mkdirSync(path.join(root, 'posts'));
    cpSync(path.join(__dirname, 'fixtures', 'posts', 'good-post'), path.join(root, 'posts', 'good-post'), { recursive: true });
    const fixture = path.join(root, 'posts', 'good-post');
    for (const slug of ['vi-only', 'en-draft']) {
      const dir = path.join(root, 'posts', slug);
      cpSync(fixture, dir, { recursive: true });
      const j = JSON.parse(readFileSync(path.join(dir, 'post.json'), 'utf8'));
      writeFileSync(path.join(dir, 'post.json'), JSON.stringify({ ...j, slug }));
    }
    rmSync(path.join(root, 'posts', 'vi-only', 'en.mdx'));
    const enPath = path.join(root, 'posts', 'en-draft', 'en.mdx');
    writeFileSync(enPath, readFileSync(enPath, 'utf8').replace(/^---\n/, '---\ndraft: true\n'));
    vi.resetModules();
    vi.stubEnv('CONTENT_ROOT', path.join(root, 'posts'));
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', SITE);
    vi.doMock('@/lib/content/vocab', () => ({ loadVocab: () => vocab }));
    return { root, route: await import('@/app/[locale]/md/[file]/route') };
  }

  it('prerenders only existing locale pairs and serves markdown headers', async () => {
    const { root, route } = await load();
    try {
      expect(route.dynamic).toBe('force-static');
      expect(route.dynamicParams).toBe(false);
      const params = route.generateStaticParams();
      expect(params).toContainEqual({ locale: 'vi', file: 'good-post.md' });
      const res = await route.GET(new Request(`${SITE}/vi/posts/good-post.md`), {
        params: Promise.resolve({ locale: 'vi', file: 'good-post.md' }),
      });
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
      expect(res.headers.get('x-robots-tag')).toBe('noindex');
      expect(res.headers.get('link')).toBe(`<${SITE}/vi/posts/good-post>; rel="canonical"`);
      const body = await res.text();
      expect(body.startsWith('# ')).toBe(true);
      expect(body).toBe(body.normalize('NFC'));
      for (const [locale, file] of [['en', 'nope.md'], ['fr', 'good-post.md'], ['vi', 'good-post']]) {
        const bad = await route.GET(new Request(`${SITE}/x`), { params: Promise.resolve({ locale, file }) });
        expect(bad.status).toBe(404);
      }
    } finally {
      vi.doUnmock('@/lib/content/vocab');
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('has no en route for a vi-only post or an en draft, at params and at GET', async () => {
    const { root, route } = await load();
    try {
      const params = route.generateStaticParams();
      expect(params).toContainEqual({ locale: 'vi', file: 'vi-only.md' });
      expect(params).not.toContainEqual({ locale: 'en', file: 'vi-only.md' });
      expect(params).toContainEqual({ locale: 'vi', file: 'en-draft.md' });
      expect(params).not.toContainEqual({ locale: 'en', file: 'en-draft.md' });
      expect(params).toContainEqual({ locale: 'en', file: 'good-post.md' });
      const get = (locale: string, file: string) =>
        route.GET(new Request(`${SITE}/x`), { params: Promise.resolve({ locale, file }) });
      expect((await get('en', 'vi-only.md')).status).toBe(404);
      expect((await get('en', 'en-draft.md')).status).toBe(404);
      expect((await get('vi', 'vi-only.md')).status).toBe(200);
      expect((await get('vi', 'en-draft.md')).status).toBe(200);
    } finally {
      vi.doUnmock('@/lib/content/vocab');
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('serves llms.txt as plain text', async () => {
    const { root } = await load();
    try {
      const r = await import('@/app/llms.txt/route');
      expect(r.dynamic).toBe('force-static');
      const res = await r.GET();
      expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
      expect(await res.text()).toContain('## Tiếng Việt');
    } finally {
      vi.doUnmock('@/lib/content/vocab');
      rmSync(root, { recursive: true, force: true });
    }
  });
});
