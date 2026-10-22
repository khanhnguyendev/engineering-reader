"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageIntro } from "@/components/page-intro";

type Strings = { title: string; body: string; home: string };

/** The root 404 cannot know the locale on the server; pick the strings from the URL. */
export function NotFoundBody({ vi, en }: { vi: Strings; en: Strings }) {
  const first = usePathname().split("/")[1];
  const t = first === "en" ? en : vi;
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 sm:px-6 lg:pt-14">
      <PageIntro title={t.title} dek={t.body} />
      <p className="flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/vi" className="mono-label text-ink underline underline-offset-4">
          {vi.home}
        </Link>
        <Link href="/en" className="mono-label text-ink underline underline-offset-4">
          {en.home}
        </Link>
      </p>
    </div>
  );
}
