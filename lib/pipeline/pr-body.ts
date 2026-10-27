import { LOCALES, type Locale } from '@/lib/i18n';
import type { Seen, Source } from '@/lib/content/schema';
import type { RawPost } from '@/lib/content/load';
import { mermaidBlocksOf } from '@/lib/content/load';
import { CHECKLIST } from '@/lib/pipeline/checklist';

export type PrPost = {
  slug: string;
  company: string;
  titles: Record<Locale, string>;
  sources: Source[];
  lessonsOmitted: Locale[];
  mermaidBlocks: number;
};
export type LedgerCounts = { picked: number; skipped: number; deferred: number; rejected: number };

export function postToPrPost(raw: RawPost): PrPost {
  const meta = (raw.meta ?? {}) as { company?: string; sources?: Source[] };
  const titles = { vi: '', en: '' } as Record<Locale, string>;
  const lessonsOmitted: Locale[] = [];
  for (const l of LOCALES) {
    const loc = raw.locales[l];
    const fm = (loc?.frontmatter ?? {}) as { title?: unknown; lessons?: unknown };
    titles[l] = typeof fm.title === 'string' ? fm.title : '';
    if (loc && !(Array.isArray(fm.lessons) && fm.lessons.length > 0)) lessonsOmitted.push(l);
  }
  return {
    slug: raw.slug,
    company: meta.company ?? '',
    titles,
    sources: meta.sources ?? [],
    lessonsOmitted,
    mermaidBlocks: mermaidBlocksOf(raw.locales.vi?.body ?? '').length,
  };
}

export function ledgerCounts(current: Seen, base: Seen): LedgerCounts {
  const out: LedgerCounts = { picked: 0, skipped: 0, deferred: 0, rejected: 0 };
  for (const [key, e] of Object.entries(current)) {
    if (key in base) continue;
    out[e.decision] += 1;
  }
  return out;
}

export function prBody(posts: PrPost[], ledger: LedgerCounts, note?: string): string {
  const s: string[] = ['## Summary', ''];
  if (posts.length === 0) s.push('No picks this run.');
  else
    for (const p of posts)
      s.push(`\`${p.slug}\` (${p.company}): ${p.titles.vi} / ${p.titles.en}`, '');
  if (posts.length === 0) s.push('');
  s.push(`Ledger: ${ledger.picked} picked, ${ledger.skipped} skipped, ${ledger.deferred} deferred, ${ledger.rejected} rejected.`, '');
  if (note) s.push(note, '');
  if (posts.length > 0) {
    s.push('## Review checklist', '');
    for (const p of posts) {
      s.push(`### ${p.slug}`, '', ...CHECKLIST.map((c) => `- [ ] ${c}`), '');
    }
    s.push('## Sources', '');
    for (const p of posts) {
      s.push(`### ${p.slug}`, '');
      for (const src of p.sources)
        s.push(`- \`${src.id}\` (${src.type}): ${src.title}, ${src.url}, locator: ${src.locator ?? '—'}`);
      s.push('');
    }
  }
  s.push('## Lessons omitted?', '');
  if (posts.length === 0) s.push('N/A', '');
  for (const p of posts)
    s.push(`- \`${p.slug}\`: ${p.lessonsOmitted.length ? `omitted in ${p.lessonsOmitted.join(', ')}` : 'N/A'}`, '');
  s.push('## Mermaid', '', 'Mermaid source only; CI renders and commits the SVGs.', '');
  for (const p of posts) s.push(`- \`${p.slug}\`: ${p.mermaidBlocks} block(s)`);
  return s.join('\n').replace(/\n+$/, '') + '\n';
}
