"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { PageIntro } from "@/components/page-intro";

type Strings = { title: string; body: string; home: string; search: string };

const LINK =
  "text-[15px] leading-[1.55] text-ink underline decoration-hairline-strong underline-offset-4 transition-colors duration-150 hover:decoration-accent";

/** The root 404 cannot know the locale on the server; pick the strings from the URL. */
const noop = () => () => {};

/**
 * The prerender runs once for every URL, so the server value is always vi. The hydration pass must
 * render that same value; React then re-renders with the real browser path.
 */
export function NotFoundBody({ vi, en, siteNameEn }: { vi: Strings; en: Strings; siteNameEn: string }) {
  const first = useSyncExternalStore(
    noop,
    () => window.location.pathname.split("/")[1],
    () => "vi",
  );
  useEffect(() => {
    if (first === "en") document.title = `${en.title} · ${siteNameEn}`;
  }, [first, en.title, siteNameEn]);
  const t = first === "en" ? en : vi;
  return (
    <div lang={first === "en" ? "en" : "vi"} className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 sm:px-6 lg:pt-14">
      <div className="max-w-[720px]">
        <PageIntro title={t.title} dek={t.body} />
      </div>
      <p className="flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/vi" lang="vi" className={LINK}>
          {vi.home}
        </Link>
        <Link href="/en" lang="en" className={LINK}>
          {en.home}
        </Link>
      </p>
      <p className="mt-2">
        <Link href={`/${first === "en" ? "en" : "vi"}/search`} lang={first === "en" ? "en" : "vi"} className={LINK}>
          {t.search}
        </Link>
      </p>
    </div>
  );
}
