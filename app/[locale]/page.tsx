import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CHIP_LINK, CHIP_MUTED } from "@/components/chip";
import { Header } from "@/components/header";
import { Monogram } from "@/components/monogram";
import { PageIntro } from "@/components/page-intro";
import { PostList } from "@/components/post-list";
import { SectionHeading } from "@/components/section-heading";
import { companiesWithCounts, featuredPosts, topicsWithCounts } from "@/lib/content/index";
import { hasLocale, listPosts } from "@/lib/content/load";
import { loadVocab } from "@/lib/content/vocab";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, plural } from "@/lib/i18n";
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
  const topics = topicsWithCounts(posts, vocab, locale);

  return (
    <>
      <Header locale={locale} />
      <main
        id="content"
        tabIndex={-1}
        className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 focus:outline-none sm:px-6 lg:pt-14"
      >
        <div className="max-w-[720px]">
          <PageIntro title={dict.site.tagline} dek={dict.home.intro} />
        </div>

        {start.length > 0 && (
          <section className="mt-10 lg:mt-14">
            <SectionHeading title={dict.home.startHere} />
            <PostList posts={start} locale={locale} vocab={vocab} dict={dict} emptyLabel="" cols={3} />
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
                    <span className="font-mono text-[13px] text-muted">
                      <span aria-hidden="true">{count}</span>
                <span className="sr-only">{plural(locale, count, dict.list.postsOne, dict.list.postsOther)}</span>
                    </span>
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
                  {count > 0 ? (
                    <Link href={`/${locale}/topics/${topic.slug}`} className={CHIP_LINK}>
                      {topic[locale]}
                      <span className="font-mono text-xs text-muted">
                        <span aria-hidden="true">{count}</span>
                        <span className="sr-only">{plural(locale, count, dict.list.postsOne, dict.list.postsOther)}</span>
                      </span>
                    </Link>
                  ) : (
                    <span className={CHIP_MUTED}>
                      {topic[locale]}
                      <span className="font-mono text-xs">
                        <span aria-hidden="true">{count}</span>
                        <span className="sr-only">{plural(locale, count, dict.list.postsOne, dict.list.postsOther)}</span>
                      </span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
