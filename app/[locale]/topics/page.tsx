import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { PageIntro } from "@/components/page-intro";
import { topicsWithCounts } from "@/lib/content/index";
import { listPosts } from "@/lib/content/load";
import { loadVocab } from "@/lib/content/vocab";
import { getDictionary, shelfDek } from "@/lib/dictionaries";
import { isLocale, plural } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return buildMetadata({
    locale,
    path: "/topics",
    title: `${dict.topics.title} · ${dict.site.name}`,
    description: dict.topics.dek,
  });
}

export default async function Page({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const topics = topicsWithCounts(listPosts(), loadVocab(), locale);

  return (
    <>
      <Header locale={locale} />
      <main
        id="content"
        tabIndex={-1}
        className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 focus:outline-none sm:px-6 lg:pt-14"
      >
        <div className="max-w-[720px]">
          <PageIntro title={dict.topics.title} dek={dict.topics.dek} />
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map(({ topic, count }) => (
            <li key={topic.slug} className="flex">
              {count > 0 ? (
                <Link
                  href={`/${locale}/topics/${topic.slug}`}
                  className="panel flex w-full flex-col gap-2 p-4 transition-colors duration-150 hover:border-hairline-strong hover:bg-panel-2 lg:p-6"
                >
                  <h2 className="text-[17px] leading-[1.35] text-ink lg:text-[19px]">{topic[locale]}</h2>
                  <p className="text-[15px] leading-[1.6] text-ink-2">{shelfDek(dict, topic.slug)}</p>
                  <span className="mt-auto pt-2 font-mono text-xs text-muted">
                    {plural(locale, count, dict.list.postsOne, dict.list.postsOther)}
                  </span>
                </Link>
              ) : (
                <div className="panel flex w-full flex-col gap-2 p-4 lg:p-6">
                  <h2 className="text-[17px] leading-[1.35] text-muted lg:text-[19px]">{topic[locale]}</h2>
                  <p className="text-[15px] leading-[1.6] text-ink-2">{shelfDek(dict, topic.slug)}</p>
                  <span className="mt-auto pt-2 font-mono text-xs text-muted">
                    {plural(locale, count, dict.list.postsOne, dict.list.postsOther)}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
