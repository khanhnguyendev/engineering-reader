import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { PageIntro } from "@/components/page-intro";
import { PostList } from "@/components/post-list";
import { SectionHeading } from "@/components/section-heading";
import { hasLocale, listPosts } from "@/lib/content/load";
import { loadVocab } from "@/lib/content/vocab";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, LOCALES, plural } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";

type Params = Promise<{ locale: string; tag: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return loadVocab().tags.flatMap((t) => LOCALES.map((locale) => ({ locale, tag: t.slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, tag: slug } = await params;
  if (!isLocale(locale)) return {};
  const tag = loadVocab().tags.find((t) => t.slug === slug);
  if (!tag) return {};
  const dict = getDictionary(locale);
  const count = listPosts().filter((p) => p.meta.tags.includes(tag.slug) && hasLocale(p, locale)).length;
  return buildMetadata({
    locale,
    path: `/tags/${tag.slug}`,
    title: `${tag[locale]} · ${dict.site.name}`,
    description: `${tag[locale]}: ${plural(locale, count, dict.list.postsOne, dict.list.postsOther)}`,
  });
}

export default async function Page({ params }: { params: Params }) {
  const { locale, tag: slug } = await params;
  if (!isLocale(locale)) notFound();
  const vocab = loadVocab();
  const tag = vocab.tags.find((t) => t.slug === slug);
  if (!tag) notFound();

  const dict = getDictionary(locale);
  const posts = listPosts().filter((p) => p.meta.tags.includes(tag.slug));
  const count = posts.filter((p) => hasLocale(p, locale)).length;

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
            title={tag[locale]}
            dek={plural(locale, count, dict.list.postsOne, dict.list.postsOther)}
          />
        </div>
        <section>
          <SectionHeading title={dict.list.posts} />
          <PostList posts={posts} locale={locale} vocab={vocab} dict={dict} emptyLabel={dict.tags.empty} />
        </section>
      </main>
    </>
  );
}
