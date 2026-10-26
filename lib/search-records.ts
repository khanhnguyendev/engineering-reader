import type { PostRecord } from '@/lib/content/load';
import type { Vocab } from '@/lib/content/vocab';
import { fold, plainText } from '@/lib/fold';
import { LOCALES } from '@/lib/i18n';

export type SearchRecord = {
  url: string;
  language: 'vi' | 'en';
  content: string;
  meta: Record<string, string>;
};

/** One Pagefind custom record per post and locale. Content carries an accent-folded copy. */
export function searchRecords(posts: readonly PostRecord[], vocab: Vocab): SearchRecord[] {
  const out: SearchRecord[] = [];
  for (const post of posts) {
    const companyName = vocab.companies.find((c) => c.slug === post.meta.company)?.name ?? post.meta.company;
    const firstKey = post.meta.keyNumbers[0];
    for (const l of LOCALES) {
      const doc = post.locales[l];
      if (!doc) continue;
      const fm = doc.frontmatter;
      const text = [fm.title, fm.summary, ...fm.tldr, ...fm.smallTeam, plainText(doc.body)].join('\n');
      const meta: Record<string, string> = {
        title: fm.title,
        summary: fm.summary,
        company: companyName,
        companyId: post.meta.company,
      };
      if (firstKey) {
        meta.keyValue = firstKey.value;
        meta.keyLabel = fm.keyNumberLabels[firstKey.id] ?? firstKey.id;
      }
      out.push({ url: `/${l}/posts/${post.slug}`, language: l, content: `${text}\n${fold(text)}`, meta });
    }
  }
  return out;
}

/** Failure lines for the index build. An empty array means OK. */
export function verdict(counts: Record<'vi' | 'en', number>, errors: string[]): string[] {
  const out: string[] = [];
  for (const lang of ['vi', 'en'] as const) {
    if (counts[lang] === 0) out.push(`✖ search index: 0 records for "${lang}"`);
  }
  if (errors.length) out.push(`✖ search index errors:\n${errors.join('\n')}`);
  return out;
}
