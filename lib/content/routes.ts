import { LOCALES, type Locale } from '../i18n';
import type { Vocab } from './vocab';

// Reached from next.config.ts via redirects.ts: relative imports only, no `@/` alias.

/** Structural subset of PostRecord, so test fixtures satisfy it too. */
export type RoutePost = {
  slug: string;
  locales: Partial<Record<Locale, unknown>>;
  meta: {
    company: string;
    topic: string;
    tags: string[];
    series: string | null;
    publishedAt: string;
    updatedAt: string | null;
  };
};

export type PageEntry = {
  /** No locale prefix; `''` is home. */
  path: string;
  locales: readonly Locale[];
  /** ISO date, posts only: `updatedAt ?? publishedAt`. */
  lastModified?: string;
};

const postLocales = (p: RoutePost): Locale[] => LOCALES.filter((l) => p.locales[l] !== undefined);

export function pageEntries(
  posts: readonly RoutePost[],
  vocab: Vocab,
  opts: { nonEmptyOnly?: boolean } = {},
): PageEntry[] {
  const all: Locale[] = [...LOCALES];
  const out: PageEntry[] = [
    { path: '', locales: all },
    { path: '/about', locales: all },
    { path: '/companies', locales: all },
    { path: '/topics', locales: all },
    { path: '/tags', locales: all },
  ];
  const group = (path: string, match: (p: RoutePost) => boolean) => {
    if (!opts.nonEmptyOnly) {
      out.push({ path, locales: all });
      return;
    }
    const mine = posts.filter(match);
    const locales = LOCALES.filter((l) => mine.some((p) => p.locales[l] !== undefined));
    if (locales.length > 0) out.push({ path, locales });
  };
  for (const c of vocab.companies) group(`/companies/${c.slug}`, (p) => p.meta.company === c.slug);
  for (const t of vocab.topics) group(`/topics/${t.slug}`, (p) => p.meta.topic === t.slug);
  for (const t of vocab.tags) group(`/tags/${t.slug}`, (p) => p.meta.tags.includes(t.slug));
  for (const key of Object.keys(vocab.series)) group(`/series/${key}`, (p) => p.meta.series === key);
  for (const p of posts) {
    out.push({
      path: `/posts/${p.slug}`,
      locales: postLocales(p),
      lastModified: p.meta.updatedAt ?? p.meta.publishedAt,
    });
  }
  return out;
}

/** The locales a page path is advertised in: those the sitemap lists, `[]` when it has no posts. */
export function localesFor(path: string, posts: readonly RoutePost[], vocab: Vocab): readonly Locale[] {
  return pageEntries(posts, vocab, { nonEmptyOnly: true }).find((e) => e.path === path)?.locales ?? [];
}

/** Non-page URLs the site serves (feeds, markdown, OG cards, root files). */
export function endpointRoutes(posts: readonly RoutePost[]): string[] {
  const out: string[] = [];
  for (const l of LOCALES) {
    out.push(`/${l}/feed.xml`, `/og/${l}/site.png`);
    for (const p of posts) {
      if (p.locales[l] === undefined) continue;
      out.push(`/${l}/posts/${p.slug}.md`, `/og/${l}/${p.slug}.png`);
    }
  }
  out.push('/llms.txt', '/sitemap.xml', '/robots.txt', '/feed.xml');
  return out;
}
