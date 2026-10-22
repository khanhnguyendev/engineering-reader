import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ReadingProgress } from "@/components/reading-progress";
import { ShareLink } from "@/components/share-link";
import { Toc } from "@/components/toc";
import { Avatar } from "@/components/post/avatar";
import { Byline } from "@/components/post/byline";
import { DeepDivider } from "@/components/post/deep-divider";
import { KeyNumbers } from "@/components/post/key-numbers";
import { Lessons } from "@/components/post/lessons";
import { MissingLocaleNote } from "@/components/post/missing-locale-note";
import { formatDate, PostMeta } from "@/components/post/post-meta";
import { Related } from "@/components/post/related";
import { SeriesNav } from "@/components/post/series-nav";
import { SmallTeam } from "@/components/post/small-team";
import { Sources } from "@/components/post/sources";
import { TagsRow } from "@/components/post/tags-row";
import { Tldr } from "@/components/post/tldr";
import { relatedPosts, seriesNav } from "@/lib/content/index";
import { CONTENT_ROOT, getPost, hasLocale, listPosts } from "@/lib/content/load";
import { loadVocab } from "@/lib/content/vocab";
import { getDictionary } from "@/lib/dictionaries";
import { fmt, isLocale, LOCALES, otherLocale } from "@/lib/i18n";
import { compilePostBody } from "@/lib/mdx/compile";
import { SITE_URL } from "@/lib/site";

type Params = Promise<{ locale: string; slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return listPosts().flatMap((post) =>
    LOCALES.filter((locale) => hasLocale(post, locale)).map((locale) => ({
      locale,
      slug: post.slug,
    })),
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const post = getPost(CONTENT_ROOT, slug);
  const doc = post?.locales[locale];
  if (!post || !doc) return {};
  const path = (l: string) => `/${l}/posts/${slug}`;
  const languages: Record<string, string> = {};
  for (const l of LOCALES) if (hasLocale(post, l)) languages[l] = path(l);
  if (hasLocale(post, "vi")) languages["x-default"] = path("vi");
  const { title, summary } = doc.frontmatter;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: summary,
    alternates: { canonical: path(locale), languages },
    openGraph: {
      type: "article",
      title,
      description: summary,
      url: path(locale),
      locale: locale === "vi" ? "vi_VN" : "en_GB",
      publishedTime: post.meta.publishedAt,
    },
  };
}

/** Typography for the compiled deep layer: sections are panels, nothing inside them is. */
const BODY = [
  "[&_section]:mb-3 [&_section]:scroll-mt-6 [&_section]:p-4 lg:[&_section]:mb-4 lg:[&_section]:px-8 lg:[&_section]:py-7",
  "[&_h2]:mb-3 [&_h2]:text-[20px] [&_h2]:leading-[1.3] [&_h2]:text-ink [&_h2]:text-balance lg:[&_h2]:mb-4 lg:[&_h2]:text-[26px] lg:[&_h2]:leading-[1.25]",
  "[&_h3]:mt-7 [&_h3]:mb-2 [&_h3]:text-[17px] [&_h3]:leading-[1.35] lg:[&_h3]:text-[19px]",
  "[&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1.5 [&_li]:marker:text-muted",
  "[&_a:not(.ref)]:underline [&_a:not(.ref)]:decoration-hairline-strong [&_a:not(.ref)]:underline-offset-4 [&_a:not(.ref):hover]:decoration-accent",
  "[&_blockquote]:my-5 [&_blockquote]:border-l [&_blockquote]:border-hairline-strong [&_blockquote]:pl-4 [&_blockquote]:text-ink-2",
].join(" ");

export default async function Page({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const post = getPost(CONTENT_ROOT, slug);
  const doc = post?.locales[locale];
  if (!post || !doc) notFound();

  const dict = getDictionary(locale);
  const vocab = loadVocab();
  const fm = doc.frontmatter;
  const { meta } = post;
  const twinMissing = !hasLocale(post, otherLocale(locale));
  const company = vocab.companies.find((c) => c.slug === meta.company);
  const companyName = company?.name ?? meta.company;
  const topic = vocab.topics.find((t) => t.slug === meta.topic)?.[locale] ?? meta.topic;
  const allPosts = listPosts();
  const nav = seriesNav(post, vocab, allPosts, locale);
  const related = relatedPosts(post, allPosts, locale);
  const { content, headings } = await compilePostBody(post, locale, dict.post.permalink);

  return (
    <>
      <ReadingProgress />
      <Header locale={locale} twinMissing={twinMissing} />
      <main
        id="content"
        tabIndex={-1}
        className="mx-auto max-w-[1200px] px-4 pb-24 focus:outline-none pt-5 sm:px-6 lg:grid lg:grid-cols-[minmax(0,720px)_260px] lg:justify-between lg:gap-10 lg:pt-10"
      >
        <article className="min-w-0">
          {twinMissing && <MissingLocaleNote text={dict.post.missingLocale} />}

          <nav aria-label={dict.post.breadcrumb} className="mb-3 text-[13px] text-muted">
            <ol className="flex min-w-0 items-center gap-1.5">
              <li className="shrink-0">
                <Link href={`/${locale}`} className="hover:text-ink">
                  {dict.post.breadcrumbHome}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="shrink-0">
                <Link href={`/${locale}/companies/${meta.company}`} className="hover:text-ink">
                  {companyName}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="min-w-0 truncate text-ink-2">
                {fm.title}
              </li>
            </ol>
          </nav>

          <TagsRow pills={[companyName, topic, dict.caseType[meta.caseType]]} />

          <h1 className="mb-3 text-[25px] leading-[1.25] text-balance text-ink lg:mb-4 lg:text-[40px] lg:leading-[1.18]">
            {fm.title}
          </h1>
          <div aria-hidden="true" className="mb-4 h-px bg-accent lg:mb-5" />
          <p className="mb-4 text-[16px] leading-[1.6] text-ink-2 lg:mb-5 lg:text-[19px]">
            {fm.summary}
          </p>
          <PostMeta
            locale={locale}
            dict={dict}
            publishedAt={meta.publishedAt}
            minutes={doc.readingTime.whole}
          />

          <KeyNumbers
            heading={dict.post.keyNumbers}
            numbers={meta.keyNumbers}
            labels={fm.keyNumberLabels}
          />
          <Tldr heading={dict.post.tldr} items={fm.tldr} />
          <SmallTeam heading={dict.post.smallTeam} items={fm.smallTeam} />

          <DeepDivider label={fmt(dict.post.deepRead, { n: doc.readingTime.deep })} />
          <Toc label={dict.post.toc} headings={headings} variant="details" />
          <div className={BODY}>{content}</div>

          {fm.lessons && <Lessons heading={dict.post.lessons} items={fm.lessons} />}
          <Sources dict={dict} locale={locale} sources={meta.sources} />
          <Byline text={dict.post.byline} />
          {nav.series && nav.index >= 0 && (
            <SeriesNav
              locale={locale}
              dict={dict}
              seriesKey={nav.series.key}
              title={nav.series[locale]}
              index={nav.index}
              total={nav.total}
              prev={nav.prev}
              next={nav.next}
            />
          )}
          <Related posts={related} locale={locale} vocab={vocab} dict={dict} />
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-8 flex flex-col gap-3">
            <div className="panel flex items-center gap-3 p-4">
              <Avatar size={36} />
              <div className="min-w-0 text-[14px] leading-[1.45]">
                <p className="font-semibold text-ink">{dict.post.byline}</p>
                <p className="font-mono text-[12px] text-muted">
                  <time dateTime={meta.publishedAt}>{formatDate(meta.publishedAt, locale)}</time>
                </p>
                <p className="font-mono text-[12px] text-muted">
                  {fmt(dict.post.readMinutes, { n: doc.readingTime.whole })}
                </p>
              </div>
            </div>
            <Toc label={dict.post.toc} headings={headings} variant="rail" />
            <ShareLink
              label={dict.post.share}
              copiedLabel={dict.post.copied}
              failedLabel={dict.post.copyFailed}
            />
          </div>
        </aside>
      </main>
    </>
  );
}
