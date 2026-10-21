import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Monogram } from "@/components/monogram";
import { PostList } from "@/components/post-list";
import { SectionHeading } from "@/components/section-heading";
import { companiesWithCounts, featuredPosts, topicsWithCounts } from "@/lib/content/index";
import { hasLocale, listPosts } from "@/lib/content/load";
import { loadVocab } from "@/lib/content/vocab";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";

type Params = Promise<{ locale: string }>;

const START_HERE = 3;
const LATEST = 6;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return buildMetadata({ locale, path: "/", title: dict.site.name, description: dict.home.intro });
}

export default async function Page({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const vocab = loadVocab();
  const posts = listPosts();
  const start = featuredPosts(posts, vocab.featured, locale, START_HERE);
  const startSlugs = new Set(start.map((p) => p.slug));
  const latest = posts
    .filter((p) => hasLocale(p, locale) && !startSlugs.has(p.slug))
    .slice(0, LATEST);
  const companies = companiesWithCounts(posts, vocab, locale).filter((c) => c.count > 0);
  const topics = topicsWithCounts(posts, vocab, locale).filter((t) => t.count > 0);

  return (
    <>
      <Header locale={locale} />
      <main
        id="content"
        tabIndex={-1}
        className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 focus:outline-none sm:px-6 lg:pt-14"
      >
        <header className="max-w-[720px]">
          <h1 className="text-[28px] leading-[1.2] text-balance text-ink lg:text-[40px] lg:leading-[1.18]">
            {dict.site.name}
          </h1>
          <p className="mt-2 text-[17px] font-semibold leading-[1.5] text-ink lg:text-[20px]">
            {dict.site.tagline}
          </p>
          <p className="mt-3 text-[16px] leading-[1.6] text-ink-2 lg:text-[19px]">{dict.home.intro}</p>
        </header>

        {start.length > 0 && (
          <section className="mt-10 lg:mt-14">
            <SectionHeading title={dict.home.startHere} />
            <PostList posts={start} locale={locale} vocab={vocab} dict={dict} emptyLabel="" />
          </section>
        )}

        {latest.length > 0 && (
          <section className="mt-12 lg:mt-16">
            <SectionHeading title={dict.home.latest} />
            <PostList posts={latest} locale={locale} vocab={vocab} dict={dict} emptyLabel="" />
          </section>
        )}

        {companies.length > 0 && (
          <section className="mt-12 lg:mt-16">
            <SectionHeading title={dict.home.byCompany} />
            <ul className="flex flex-wrap gap-x-8 gap-y-4">
              {companies.map(({ company, count }) => (
                <li key={company.slug}>
                  <Link
                    href={`/${locale}/companies/${company.slug}`}
                    className="group inline-flex min-h-8 items-center gap-2.5 text-ink"
                  >
                    <Monogram name={company.name} size={32} />
                    <span className="text-[16px] font-semibold underline decoration-transparent underline-offset-4 transition-colors duration-150 group-hover:decoration-accent">
                      {company.name}
                    </span>
                    <span className="font-mono text-[13px] text-muted">{count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {topics.length > 0 && (
          <section className="mt-12 lg:mt-16">
            <SectionHeading title={dict.home.byTopic} />
            <ul className="flex flex-wrap gap-2">
              {topics.map(({ topic, count }) => (
                <li key={topic.slug}>
                  <Link
                    href={`/${locale}/topics/${topic.slug}`}
                    className="inline-flex items-baseline gap-2 rounded-md border border-hairline-strong px-2.5 py-1 text-[13px] leading-[1.35] text-ink-2 transition-colors duration-150 hover:bg-panel-2 hover:text-ink"
                  >
                    {topic[locale]}
                    <span className="font-mono text-xs text-muted">{count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
