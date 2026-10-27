import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { PageIntro } from "@/components/page-intro";
import { BODY } from "@/components/post/body-classes";
import { Byline } from "@/components/post/byline";
import { CONTENT_ROOT } from "@/lib/content/load";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";
import { compilePage } from "@/lib/mdx/compile";
import { buildMetadata } from "@/lib/metadata";

type Params = Promise<{ locale: string }>;

/** `content/pages` sits beside the posts root, so a relocated CONTENT_ROOT carries its pages with it. */
function readAbout(locale: Locale): string {
  return readFileSync(path.join(CONTENT_ROOT, "..", "pages", `about.${locale}.mdx`), "utf8").replace(/\r\n/g, "\n");
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return buildMetadata({
    locale,
    path: "/about",
    title: `${dict.about.title} · ${dict.site.name}`,
    description: dict.about.dek,
  });
}

export default async function Page({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const { content } = await compilePage(readAbout(locale), locale, dict.post.permalink);

  return (
    <>
      <Header locale={locale} />
      <main
        id="content"
        tabIndex={-1}
        className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 focus:outline-none sm:px-6 lg:pt-14"
      >
        <article className="max-w-[720px]">
          <PageIntro title={dict.about.title} dek={dict.about.dek} />
          <div className={BODY}>{content}</div>
          <div className={`${BODY} mt-6`}>
            <p>
              {dict.about.rss} <a href={`/${locale}/feed.xml`} className="whitespace-nowrap">{dict.about.rssLink}</a>
            </p>
          </div>
          <Byline text={dict.post.byline} />
        </article>
      </main>
    </>
  );
}
