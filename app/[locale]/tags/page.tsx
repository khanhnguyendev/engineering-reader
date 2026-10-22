import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CHIP_LINK } from "@/components/chip";
import { Header } from "@/components/header";
import { PageIntro } from "@/components/page-intro";
import { tagsWithCounts } from "@/lib/content/index";
import { listPosts } from "@/lib/content/load";
import { loadVocab } from "@/lib/content/vocab";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, plural } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return buildMetadata({
    locale,
    path: "/tags",
    title: `${dict.tags.title} · ${dict.site.name}`,
    description: dict.tags.dek,
  });
}

export default async function Page({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const tags = tagsWithCounts(listPosts(), loadVocab(), locale).sort((a, b) =>
    a.tag[locale].localeCompare(b.tag[locale], locale),
  );

  return (
    <>
      <Header locale={locale} />
      <main
        id="content"
        tabIndex={-1}
        className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 focus:outline-none sm:px-6 lg:pt-14"
      >
        <div className="max-w-[720px]">
          <PageIntro title={dict.tags.title} dek={dict.tags.dek} />
        </div>
        <ul className="flex max-w-[960px] flex-wrap gap-2">
          {tags.map(({ tag, count }) => (
            <li key={tag.slug}>
              <Link
                href={`/${locale}/tags/${tag.slug}`}
                className={CHIP_LINK}
              >
                {tag[locale]}
                <span className="font-mono text-xs text-muted">
                  <span aria-hidden="true">{count}</span>
                <span className="sr-only">{plural(locale, count, dict.list.postsOne, dict.list.postsOther)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
