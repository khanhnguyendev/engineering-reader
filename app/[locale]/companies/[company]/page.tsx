import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { PageIntro } from "@/components/page-intro";
import { PostList } from "@/components/post-list";
import { SectionHeading } from "@/components/section-heading";
import { companiesWithCounts } from "@/lib/content/index";
import { listPosts } from "@/lib/content/load";
import { localesFor } from "@/lib/content/routes";
import { loadVocab } from "@/lib/content/vocab";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, LOCALES, plural } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";

type Params = Promise<{ locale: string; company: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return loadVocab().companies.flatMap((c) =>
    LOCALES.map((locale) => ({ locale, company: c.slug })),
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, company: slug } = await params;
  if (!isLocale(locale)) return {};
  const vocab = loadVocab();
  const entry = companiesWithCounts(listPosts(), vocab, locale).find((e) => e.company.slug === slug);
  if (!entry) return {};
  const { company, count } = entry;
  const dict = getDictionary(locale);
  return buildMetadata({
    locale,
    path: `/companies/${company.slug}`,
    locales: localesFor(`/companies/${company.slug}`, listPosts(), loadVocab()),
    title: `${company.name} · ${dict.site.name}`,
    description: `${company.name}: ${plural(locale, count, dict.list.postsOne, dict.list.postsOther)}`,
  });
}

export default async function Page({ params }: { params: Params }) {
  const { locale, company: slug } = await params;
  if (!isLocale(locale)) notFound();
  const vocab = loadVocab();
  const allPosts = listPosts();
  const entry = companiesWithCounts(allPosts, vocab, locale).find((e) => e.company.slug === slug);
  if (!entry) notFound();
  const { company, count } = entry;

  const dict = getDictionary(locale);
  const posts = allPosts.filter((p) => p.meta.company === company.slug);

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
            title={company.name}
            dek={plural(locale, count, dict.list.postsOne, dict.list.postsOther)}
          >
            <a
              href={company.blogUrl}
              rel="noopener noreferrer"
              target="_blank"
              className="mono-label mt-3 inline-block text-muted underline decoration-hairline-strong underline-offset-4 transition-colors duration-150 hover:text-ink hover:decoration-accent"
            >
              {dict.companies.blog}
            </a>
          </PageIntro>
        </div>
        <section>
          <SectionHeading title={dict.list.posts} />
          <PostList posts={posts} locale={locale} vocab={vocab} dict={dict} emptyLabel={dict.companies.empty} />
        </section>
      </main>
    </>
  );
}
