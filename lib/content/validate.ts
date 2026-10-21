import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { LOCALES } from '@/lib/i18n';
import { parsePost, readRawPost, type RawPost, type ZodIssueWithFile } from '@/lib/content/load';
import { hostOf } from '@/lib/content/normalize-url';
import type { Vocab } from '@/lib/content/vocab';

export type Finding = {
  level: 'error' | 'warn';
  rule: string;
  slug: string;
  file?: string;
  message: string;
};
export type ValidateOpts = { today: string };

const MAX_FILE = 300 * 1024;
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|svg|avif)$/i;
const MAX_DIR = 2 * 1024 * 1024;
const DEEP = { min: 6, max: 10 };
const WHOLE = { min: 8, max: 12 };
const SVG_UNSAFE: [RegExp, string][] = [
  [/<script/i, '<script>'],
  [/<[^>]*\son[a-z]+\s*=/i, 'an event-handler attribute'],
  [/javascript:/i, 'a javascript: URL'],
];
const ENUM_KEYS = new Set(['topic', 'caseType', 'tags', 'company', 'series']);

export function zodIssuesToFindings(
  issues: (Pick<ZodIssueWithFile, 'path' | 'message'> & { file?: string })[],
  slug: string,
): Finding[] {
  return issues.map((i) => {
    const p = i.path.map(String);
    let rule = 'schema';
    if (p[0] === 'sources' && p[2] === 'locator') rule = 'locator';
    else if (p[0] !== undefined && ENUM_KEYS.has(p[0])) rule = 'enum';
    else if (p[0] === 'summary') rule = 'summary-length';
    const where = p.length > 0 ? `${p.join('.')}: ` : '';
    return { level: 'error', rule, slug, file: i.file, message: `${where}${i.message}` };
  });
}

function parseErrorOf(v: unknown): string | undefined {
  if (v && typeof v === 'object' && '__parseError' in v) {
    return String((v as { __parseError: unknown }).__parseError);
  }
  return undefined;
}

function stripFences(body: string): string {
  return body.replace(/```[\s\S]*?```/g, ' ');
}

function isExternal(src: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(src.trim());
}

function dayNumber(s: string): number {
  const [y, m, d] = s.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

function listFiles(dir: string): { rel: string; size: number }[] {
  const out: { rel: string; size: number }[] = [];
  for (const rel of readdirSync(dir, { recursive: true }) as string[]) {
    const st = statSync(path.join(dir, rel));
    if (st.isFile()) out.push({ rel, size: st.size });
  }
  return out;
}

export function validatePost(raw: RawPost, vocab: Vocab, opts: ValidateOpts): Finding[] {
  const slug = raw.slug;
  const out: Finding[] = [];
  const add = (level: Finding['level'], rule: string, message: string, file?: string) =>
    out.push({ level, rule, slug, file, message });

  for (const locale of LOCALES) {
    if (!raw.locales[locale]) add('error', 'locales', `${locale}.mdx is missing`, `${locale}.mdx`);
  }

  // Parse failures (JSON/YAML) short-circuit schema checks for that file.
  let parseFailed = false;
  const metaErr = parseErrorOf(raw.meta);
  if (metaErr !== undefined) {
    add('error', 'schema', `cannot parse: ${metaErr}`, 'post.json');
    parseFailed = true;
  }
  for (const locale of LOCALES) {
    const rl = raw.locales[locale];
    const e = rl && parseErrorOf(rl.frontmatter);
    if (rl && e !== undefined) {
      add('error', 'schema', `cannot parse: ${e}`, rl.file);
      parseFailed = true;
    }
  }

  // Own locator check on raw meta: zod 4 skips superRefine when other issues exist.
  const seen = new Set<string>();
  const pushUnique = (f: Finding) => {
    const k = `${f.rule}|${f.file}|${f.message}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(f);
    }
  };
  const rawSources = (raw.meta as { sources?: unknown } | null)?.sources;
  if (Array.isArray(rawSources)) {
    rawSources.forEach((s, i) => {
      if (s && typeof s === 'object') {
        const { type, locator } = s as { type?: unknown; locator?: unknown };
        if ((type === 'talk' || type === 'paper') && !locator) {
          pushUnique({
            level: 'error', rule: 'locator', slug, file: 'post.json',
            message: `sources.${i}.locator: locator is required for ${type} sources`,
          });
        }
      }
    });
  }

  if (parseFailed) return out;

  const { post, issues } = parsePost(raw);
  for (const f of zodIssuesToFindings(issues, slug)) pushUnique(f);
  if (!post) return out;

  const meta = post.meta;

  // schema: slug must equal folder name
  const folder = path.basename(raw.dir);
  if (meta.slug !== folder) {
    add('error', 'schema', `slug "${meta.slug}" does not match folder name "${folder}"`, 'post.json');
  }

  // enum (vocab membership)
  if (!vocab.companies.some((c) => c.slug === meta.company)) {
    add('error', 'enum', `company "${meta.company}" is not in companies.json`, 'post.json');
  }
  const tagSlugs = new Set(vocab.tags.map((t) => t.slug));
  for (const t of meta.tags) {
    if (!tagSlugs.has(t)) add('error', 'enum', `tag "${t}" is not in tags.json`, 'post.json');
  }
  if (meta.series !== null && !Object.hasOwn(vocab.series, meta.series)) {
    add('error', 'enum', `series "${meta.series}" is not in series.json`, 'post.json');
  } else if (meta.series !== null && !vocab.series[meta.series].slugs.includes(meta.slug)) {
    add('error', 'enum', `slug "${meta.slug}" is not listed in series "${meta.series}" in series.json`, 'post.json');
  }

  // labels
  const ids = new Set(meta.keyNumbers.map((k) => k.id));
  for (const locale of LOCALES) {
    const doc = post.locales[locale];
    if (!doc) continue;
    const keys = new Set(Object.keys(doc.frontmatter.keyNumberLabels));
    const missing = [...ids].filter((i) => !keys.has(i));
    const extra = [...keys].filter((k) => !ids.has(k));
    if (missing.length > 0 || extra.length > 0) {
      add(
        'error', 'labels',
        `keyNumberLabels must match keyNumbers ids (missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'})`,
        raw.locales[locale]?.file,
      );
    }
  }

  // refs
  const sourceIds = new Set(meta.sources.map((s) => s.id));
  const used = new Set<string>();
  for (const k of meta.keyNumbers) {
    used.add(k.ref);
    if (!sourceIds.has(k.ref)) {
      add('error', 'refs', `keyNumbers "${k.id}" refers to unknown source ${k.ref}`, 'post.json');
    }
  }
  for (const locale of LOCALES) {
    const doc = post.locales[locale];
    if (!doc) continue;
    const reported = new Set<string>();
    for (const r of doc.refs) {
      used.add(r.id);
      if (!sourceIds.has(r.id) && !reported.has(r.id)) {
        reported.add(r.id);
        add('error', 'refs', `body reference [${r.id}] has no matching source`, raw.locales[locale]?.file);
      }
    }
  }
  for (const id of sourceIds) {
    if (!used.has(id)) add('error', 'refs', `source ${id} is never referenced`, 'post.json');
  }

  // source-host
  const company = vocab.companies.find((c) => c.slug === meta.company);
  const companyHost = company ? hostOf(company.blogUrl) : undefined;
  const allowed = new Set(vocab.sourceHosts.map((h) => h.toLowerCase()));
  for (const s of meta.sources) {
    const h = hostOf(s.url);
    if (h !== companyHost && !allowed.has(h)) {
      add('error', 'source-host', `source ${s.id} host "${h}" is neither the company blog host nor in source-hosts.json`, 'post.json');
    }
  }

  // image-external, alt-text, mermaid-count
  const mermaid: Record<string, number> = {};
  for (const locale of LOCALES) {
    const rl = raw.locales[locale];
    if (!rl || rl.draft) continue;
    const text = stripFences(rl.body);
    for (const m of text.matchAll(/!\[([^\]]*)\]\(\s*<?([^)\s>]*)/g)) {
      if (isExternal(m[2])) add('error', 'image-external', `external image URL: ${m[2]}`, rl.file);
      if (m[1].trim() === '') add('error', 'alt-text', `image "${m[2]}" has empty alt text`, rl.file);
    }
    for (const m of text.matchAll(/<img\b[^>]*>/gi)) {
      const src = /\bsrc\s*=\s*["']([^"']*)["']/i.exec(m[0])?.[1] ?? '';
      const alt = /\balt\s*=\s*["']([^"']*)["']/i.exec(m[0])?.[1] ?? '';
      if (isExternal(src)) add('error', 'image-external', `external image URL: ${src}`, rl.file);
      if (alt.trim() === '') add('error', 'alt-text', `image "${src}" has empty alt text`, rl.file);
    }
    mermaid[locale] = post.locales[locale]?.mermaidBlocks.length ?? 0;
  }
  const counts = Object.values(mermaid);
  if (counts.length > 1 && new Set(counts).size > 1) {
    add('error', 'mermaid-count', `mermaid block counts differ across locales: ${JSON.stringify(mermaid)}`);
  }

  // asset-size, svg-unsafe
  if (existsSync(raw.dir)) {
    let total = 0;
    const files = listFiles(raw.dir);
    for (const f of files) {
      total += f.size;
      if (IMAGE_EXT.test(f.rel) && f.size > MAX_FILE) {
        add('error', 'asset-size', `${f.rel} is ${Math.round(f.size / 1024)} KB, over the 300 KB limit`, f.rel);
      }
    }
    for (const f of files) {
      if (!/\.svg$/i.test(f.rel)) continue;
      const svg = readFileSync(path.join(raw.dir, f.rel), 'utf8');
      const hits = SVG_UNSAFE.filter(([re]) => re.test(svg)).map(([, what]) => what);
      if (hits.length > 0) add('error', 'svg-unsafe', `${f.rel} contains ${hits.join(', ')}`, f.rel);
    }
    if (total > MAX_DIR) {
      add('error', 'asset-size', `post folder is ${(total / 1024 / 1024).toFixed(2)} MB, over the 2 MB limit`);
    }
  }

  // reading-time
  for (const locale of LOCALES) {
    const doc = post.locales[locale];
    if (!doc) continue;
    const { deep, whole } = doc.readingTime;
    const file = raw.locales[locale]?.file;
    if (deep < DEEP.min || deep > DEEP.max) {
      add('error', 'reading-time', `${locale} deep layer is ${deep} min, expected ${DEEP.min}-${DEEP.max}`, file);
    }
    if (whole < WHOLE.min || whole > WHOLE.max) {
      add('error', 'reading-time', `${locale} whole post is ${whole} min, expected ${WHOLE.min}-${WHOLE.max}`, file);
    }
  }

  // warnings
  if (dayNumber(opts.today) - dayNumber(meta.publishedAt) > 3) {
    add('warn', 'published-at', `publishedAt ${meta.publishedAt} is more than 3 days before ${opts.today}`, 'post.json');
  }
  for (const locale of LOCALES) {
    const doc = post.locales[locale];
    if (doc && !doc.frontmatter.lessons) {
      add('warn', 'lessons-omitted', `${locale} has no lessons`, raw.locales[locale]?.file);
    }
  }

  return out;
}

const LEVEL_ORDER = { error: 0, warn: 1 } as const;

export function validateAll(
  root: string,
  vocab: Vocab,
  opts: ValidateOpts,
): { findings: Finding[]; ok: boolean } {
  const findings: Finding[] = [];
  if (existsSync(root)) {
    for (const name of readdirSync(root).sort()) {
      const dir = path.join(root, name);
      if (!statSync(dir).isDirectory()) continue;
      const hasJson = existsSync(path.join(dir, 'post.json'));
      const hasMdx = LOCALES.some((l) => existsSync(path.join(dir, `${l}.mdx`)));
      if (!hasJson && !hasMdx) continue;
      if (!hasJson) {
        findings.push({ level: 'error', rule: 'schema', slug: name, file: 'post.json', message: 'post.json missing' });
        continue;
      }
      findings.push(...validatePost(readRawPost(dir), vocab, opts));
    }
  }
  const hasPost = (slug: string) => existsSync(path.join(root, slug, 'post.json'));
  // featured.json drives the home "start here" row; post.json.featured is ignored.
  for (const slug of vocab.featured) {
    if (!hasPost(slug)) {
      findings.push({ level: 'error', rule: 'featured', slug, file: 'featured.json', message: `featured slug ${slug} has no post` });
    }
  }
  for (const [key, s] of Object.entries(vocab.series)) {
    for (const slug of s.slugs) {
      if (!hasPost(slug)) {
        findings.push({ level: 'error', rule: 'enum', slug, file: 'series.json', message: `series "${key}" lists slug "${slug}", which has no post` });
      }
    }
  }
  findings.sort(
    (a, b) => a.slug.localeCompare(b.slug) || LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level],
  );
  return { findings, ok: !findings.some((f) => f.level === 'error') };
}
