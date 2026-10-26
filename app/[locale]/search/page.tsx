import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { PageIntro } from "@/components/page-intro";
import { SearchBox } from "@/components/search/search-box";
import { topicsWithCounts } from "@/lib/content/index";
import { listPosts } from "@/lib/content/load";
import { loadVocab } from "@/lib/content/vocab";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, LOCALES } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";

type Params = Promise<{ locale: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return buildMetadata({
    locale,
    path: "/search",
    title: `${dict.search.title} · ${dict.site.name}`,
    description: dict.search.dek,
    noindex: true,
  });
}

export default async function Page({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const vocab = loadVocab();

  return (
    <>
      <Header locale={locale} />
      <main
        id="content"
        tabIndex={-1}
        className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 focus:outline-none sm:px-6 lg:pt-14"
      >
        <div className="max-w-[720px]">
          <PageIntro title={dict.search.title} dek={dict.search.dek} />
          <SearchBox
            locale={locale}
            t={dict.search}
            list={{ postsOne: dict.list.postsOne, postsOther: dict.list.postsOther }}
            companies={vocab.companies.map((c) => ({ slug: c.slug, name: c.name, brandColor: c.brandColor }))}
            topics={topicsWithCounts(listPosts(), vocab, locale).map(({ topic, count }) => ({
              slug: topic.slug,
              label: topic[locale],
              count,
            }))}
          />
        </div>
      </main>
    </>
  );
}
