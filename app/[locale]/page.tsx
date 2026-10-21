import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { hasLocale, listPosts } from "@/lib/content/load";
import { loadVocab } from "@/lib/content/vocab";
import { getDictionary } from "@/lib/dictionaries";
import { fmt, isLocale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: dict.site.name,
    description: dict.site.tagline,
    alternates: {
      canonical: `/${locale}`,
      languages: { vi: "/vi", en: "/en", "x-default": "/vi" },
    },
    openGraph: { locale },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const vocab = loadVocab();
  const posts = listPosts().filter((p) => hasLocale(p, locale));

  return (
    <>
      <Header locale={locale} />
      <main
        id="content"
        tabIndex={-1}
        className="mx-auto max-w-[720px] px-4 pb-24 pt-8 focus:outline-none sm:px-6 lg:pt-14"
      >
        <h1 className="text-[28px] font-bold leading-[1.2] text-ink lg:text-[40px]">
          {dict.site.name}
        </h1>
        <p className="mt-2 mb-8 text-[16px] leading-[1.6] text-ink-2 lg:mb-10 lg:text-[19px]">
          {dict.site.tagline}
        </p>
        <ul className="flex flex-col gap-3">
          {posts.map((post) => {
            const doc = post.locales[locale]!;
            const fm = doc.frontmatter;
            const first = post.meta.keyNumbers[0];
            const company =
              vocab.companies.find((c) => c.slug === post.meta.company)?.name ??
              post.meta.company;
            return (
              <li key={post.slug}>
                <Link
                  href={`/${locale}/posts/${post.slug}`}
                  className="panel block p-4 transition-colors duration-150 hover:bg-panel-2 lg:px-6 lg:py-5"
                >
                  <span className="mono-label block">{company}</span>
                  <span className="mt-1 block text-[18px] font-semibold leading-[1.3] text-ink text-balance lg:text-[20px]">
                    {fm.title}
                  </span>
                  {first && (
                    <span className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <span className="font-mono text-[15px] font-semibold tracking-[-0.02em] text-ink">
                        {first.value}
                      </span>
                      <span className="text-[13px] leading-[1.45] text-ink-2">
                        {fm.keyNumberLabels[first.id] ?? first.id}
                      </span>
                    </span>
                  )}
                  <span className="mt-2 block font-mono text-[12px] text-muted">
                    {fmt(dict.post.readMinutes, { n: doc.readingTime.whole })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
