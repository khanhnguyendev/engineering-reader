import { hasLocale, type PostRecord } from './content/load';
import type { Vocab } from './content/vocab';
import type { Dictionary } from './dictionaries';
import { LOCALES, type Locale } from './i18n';

const nfc = (s: string) => s.normalize('NFC');

/** One post as Markdown, in spec §6 order: top layer, divider, deep layer, lessons, sources. */
export function postMarkdown(
  post: PostRecord,
  locale: Locale,
  vocab: Vocab,
  dict: Dictionary,
  siteUrl: string,
): string {
  const { meta } = post;
  const fm = post.locales[locale]!.frontmatter;
  const company = vocab.companies.find((c) => c.slug === meta.company)?.name ?? meta.company;
  const topic = vocab.topics.find((t) => t.slug === meta.topic)?.[locale] ?? meta.topic;
  const bullets = (items: readonly string[]) => items.map((i) => `- ${i}`);

  const out: string[] = [
    `# ${fm.title}`,
    `> ${fm.summary}`,
    [company, topic, meta.publishedAt, `${siteUrl}/${locale}/posts/${post.slug}`].join(' · '),
    `## ${dict.post.keyNumbers}`,
    meta.keyNumbers
      .map((k) => [`- **${k.value}**`, fm.keyNumberLabels[k.id], `[${k.ref}]`].filter(Boolean).join(' '))
      .join('\n'),
    `## ${dict.post.tldr}`,
    bullets(fm.tldr).join('\n'),
    `## ${dict.post.smallTeam}`,
    bullets(fm.smallTeam).join('\n'),
    '---',
    post.locales[locale]!.body.trim(),
  ];
  if (fm.lessons?.length) out.push(`## ${dict.post.lessons}`, bullets(fm.lessons).join('\n'));
  out.push(
    `## ${dict.post.sources}`,
    meta.sources
      .map((s) => {
        const head = [s.title, ...(s.authors.length ? [s.authors.join(', ')] : []), s.publishedAt].join(', ');
        return `- [${s.id}] ${head}. ${s.url}${s.locator ? ` (${s.locator})` : ''}`;
      })
      .join('\n'),
    dict.post.aiLine,
  );
  return nfc(`${out.join('\n\n')}\n`);
}

/** llmstxt.org index for agents: both locales, absolute links to the `.md` route. */
export function llmsTxt(
  posts: readonly PostRecord[],
  vocab: Vocab,
  dicts: Record<Locale, Dictionary>,
  siteUrl: string,
): string {
  void vocab;
  const sections = LOCALES.map((l) => {
    const lines = posts
      .filter((p) => hasLocale(p, l))
      .sort((a, b) => b.meta.publishedAt.localeCompare(a.meta.publishedAt) || a.slug.localeCompare(b.slug))
      .map((p) => {
        const fm = p.locales[l]!.frontmatter;
        return `- [${fm.title}](${siteUrl}/${l}/posts/${p.slug}.md): ${fm.summary}`;
      });
    return `## ${dicts[l].llms.section}\n\n${lines.join('\n')}`;
  });
  const optional = [
    '## Optional',
    '',
    ...LOCALES.map((l) => `- [${dicts[l].feed.title}](${siteUrl}/${l}/feed.xml)`),
    `- [sitemap.xml](${siteUrl}/sitemap.xml)`,
  ].join('\n');
  const head = [
    `# ${dicts.vi.site.name}`,
    `> ${dicts.vi.site.tagline} / ${dicts.en.site.tagline.replace(/\u00a0/g, ' ')}`,
    `${dicts.vi.llms.intro} ${dicts.en.llms.intro}`,
  ].join('\n\n');
  return nfc(`${[head, ...sections, optional].join('\n\n')}\n`);
}
