import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { PageIntro } from "@/components/page-intro";
import { PostList } from "@/components/post-list";
import { SectionHeading } from "@/components/section-heading";
import { listPosts } from "@/lib/content/load";
import { loadVocab } from "@/lib/content/vocab";
import { getDictionary, shelfDek } from "@/lib/dictionaries";
import { isLocale, LOCALES } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";

type Params = Promise<{ locale: string; topic: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return loadVocab().topics.flatMap((t) => LOCALES.map((locale) => ({ locale, topic: t.slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, topic: slug } = await params;
  if (!isLocale(locale)) return {};
  const topic = loadVocab().topics.find((t) => t.slug === slug);
  if (!topic) return {};
  const dict = getDictionary(locale);
  return buildMetadata({
    locale,
    path: `/topics/${topic.slug}`,
    title: `${topic[locale]} · ${dict.site.name}`,
    description: shelfDek(dict, topic.slug),
  });
}

export default async function Page({ params }: { params: Params }) {
  const { locale, topic: slug } = await params;
  if (!isLocale(locale)) notFound();
  const vocab = loadVocab();
  const topic = vocab.topics.find((t) => t.slug === slug);
  if (!topic) notFound();

  const dict = getDictionary(locale);
  const posts = listPosts().filter((p) => p.meta.topic === topic.slug);

  return (
    <>
      <Header locale={locale} />
      <main
        id="content"
        tabIndex={-1}
        className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 focus:outline-none sm:px-6 lg:pt-14"
      >
        <div className="max-w-[720px]">
          <PageIntro title={topic[locale]} dek={shelfDek(dict, topic.slug)} />
        </div>
        <section>
          <SectionHeading title={dict.list.posts} />
          <PostList posts={posts} locale={locale} vocab={vocab} dict={dict} emptyLabel={dict.topics.empty} />
        </section>
      </main>
    </>
  );
}
