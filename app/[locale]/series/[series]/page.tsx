import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { PageIntro } from "@/components/page-intro";
import { hasLocale, listPosts, type PostRecord } from "@/lib/content/load";
import { loadVocab } from "@/lib/content/vocab";
import { getDictionary } from "@/lib/dictionaries";
import { fmt, isLocale, LOCALES, plural, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";

type Params = Promise<{ locale: string; series: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(loadVocab().series).flatMap((series) =>
    LOCALES.map((locale) => ({ locale, series })),
  );
}

/** The series' own order, restricted to posts that exist in `locale`. */
function orderedPosts(slugs: readonly string[], locale: Locale): PostRecord[] {
  const bySlug = new Map(listPosts().map((p) => [p.slug, p]));
  return slugs
    .map((s) => bySlug.get(s))
    .filter((p): p is PostRecord => p !== undefined && hasLocale(p, locale));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, series: key } = await params;
  if (!isLocale(locale)) return {};
  const vocab = loadVocab();
  if (!Object.hasOwn(vocab.series, key)) return {};
  const series = vocab.series[key];
  const dict = getDictionary(locale);
  const count = orderedPosts(series.slugs, locale).length;
  return buildMetadata({
    locale,
    path: `/series/${key}`,
    title: `${series[locale]} · ${dict.site.name}`,
    description: `${series[locale]}: ${plural(locale, count, dict.list.postsOne, dict.list.postsOther)}`,
  });
}

export default async function Page({ params }: { params: Params }) {
  const { locale, series: key } = await params;
  if (!isLocale(locale)) notFound();
  const vocab = loadVocab();
  if (!Object.hasOwn(vocab.series, key)) notFound();
  const series = vocab.series[key];

  const dict = getDictionary(locale);
  const posts = orderedPosts(series.slugs, locale);

  return (
    <>
      <Header locale={locale} />
      <main
        id="content"
        tabIndex={-1}
        className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 focus:outline-none sm:px-6 lg:pt-14"
      >
        <div className="max-w-[720px]">
          <PageIntro
            title={series[locale]}
            dek={plural(locale, posts.length, dict.list.postsOne, dict.list.postsOther)}
          />
        </div>
        <ol className="flex max-w-[720px] flex-col gap-3">
          {posts.map((post, i) => (
            <li key={post.slug}>
              <Link
                href={`/${locale}/posts/${post.slug}`}
                className="panel flex flex-col gap-1 p-4 transition-colors duration-150 hover:border-hairline-strong hover:bg-panel-2 lg:p-6"
              >
                <span className="mono-label text-muted">
                  {fmt(dict.series.part, { i: i + 1, n: posts.length })}
                </span>
                <span className="text-[17px] font-bold leading-[1.35] text-ink">
                  {post.locales[locale]?.frontmatter.title}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}
