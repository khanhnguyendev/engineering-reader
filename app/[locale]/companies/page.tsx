import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Monogram } from "@/components/monogram";
import { PageIntro } from "@/components/page-intro";
import { companiesWithCounts } from "@/lib/content/index";
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
    path: "/companies",
    title: `${dict.companies.title} · ${dict.site.name}`,
    description: dict.companies.dek,
  });
}

export default async function Page({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const companies = companiesWithCounts(listPosts(), loadVocab(), locale);

  return (
    <>
      <Header locale={locale} />
      <main
        id="content"
        tabIndex={-1}
        className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 focus:outline-none sm:px-6 lg:pt-14"
      >
        <div className="max-w-[720px]">
          <PageIntro title={dict.companies.title} dek={dict.companies.dek} />
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map(({ company, count }) => (
            <li
              key={company.slug}
              className="panel relative flex flex-col gap-4 p-4 transition-colors duration-150 hover:border-hairline-strong hover:bg-panel-2 lg:p-6"
            >
              <div className="flex items-center gap-3">
                <Monogram name={company.name} color={company.brandColor} size={40} />
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-[17px] leading-[1.35] text-ink lg:text-[19px]">
                    <Link
                      href={`/${locale}/companies/${company.slug}`}
                      className="after:absolute after:inset-0 after:rounded-panel"
                    >
                      {company.name}
                    </Link>
                  </h2>
                  <p className="font-mono text-xs text-muted">
                    {plural(locale, count, dict.companies.postsOne, dict.companies.postsOther)}
                  </p>
                </div>
              </div>
              <div className="mt-auto border-t border-hairline pt-3">
                <a
                  href={company.blogUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="mono-label relative z-10 text-muted underline decoration-hairline-strong underline-offset-4 transition-colors duration-150 hover:text-ink hover:decoration-accent"
                >
                  {dict.companies.blog}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
