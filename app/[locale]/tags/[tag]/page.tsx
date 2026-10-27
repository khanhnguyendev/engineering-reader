import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { PageIntro } from "@/components/page-intro";
import { PostList } from "@/components/post-list";
import { tagsWithCounts } from "@/lib/content/index";
import { listPosts } from "@/lib/content/load";
import { localesFor } from "@/lib/content/routes";
import { loadVocab } from "@/lib/content/vocab";
import { getDictionary } from "@/lib/dictionaries";
import { fmt, isLocale, LOCALES, otherLocale, plural } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";

type Params = Promise<{ locale: string; tag: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  const posts = listPosts();
  const vocab = loadVocab();
  return LOCALES.flatMap((locale) =>
    tagsWithCounts(posts, vocab, locale)
      .filter((t) => t.count > 0)
      .map((t) => ({ locale, tag: t.tag.slug })),
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, tag: slug } = await params;
  if (!isLocale(locale)) return {};
  const entry = tagsWithCounts(listPosts(), loadVocab(), locale).find((e) => e.tag.slug === slug);
  if (!entry) return {};
  const { tag, count } = entry;
  const dict = getDictionary(locale);
  return buildMetadata({
    locale,
    path: `/tags/${tag.slug}`,
    locales: localesFor(`/tags/${tag.slug}`, listPosts(), loadVocab()),
    title: `${tag[locale]} · ${dict.site.name}`,
    description: `${tag[locale]}: ${plural(locale, count, dict.list.postsOne, dict.list.postsOther)}`,
  });
}

export default async function Page({ params }: { params: Params }) {
  const { locale, tag: slug } = await params;
  if (!isLocale(locale)) notFound();
  const vocab = loadVocab();
  const allPosts = listPosts();
  const entry = tagsWithCounts(allPosts, vocab, locale).find((e) => e.tag.slug === slug);
  if (!entry || entry.count === 0) notFound();
  const { tag, count } = entry;

  const dict = getDictionary(locale);
  const posts = allPosts.filter((p) => p.meta.tags.includes(tag.slug));
  const twin = localesFor(`/tags/${tag.slug}`, allPosts, vocab).includes(otherLocale(locale));

  return (
    <>
      <Header locale={locale} twinMissing={!twin} />
      <main
        id="content"
        tabIndex={-1}
        className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 focus:outline-none sm:px-6 lg:pt-14"
      >
        <div className="max-w-[720px]">
          <PageIntro
            title={tag[locale]}
            dek={fmt(dict.tags.pageDek, {
              count: plural(locale, count, dict.list.postsOne, dict.list.postsOther),
              tag: tag[locale],
            })}
          />
        </div>
        <section>
          <h2 className="sr-only">{dict.list.posts}</h2>
          <PostList posts={posts} locale={locale} vocab={vocab} dict={dict} emptyLabel={dict.tags.empty} />
        </section>
      </main>
    </>
  );
}
