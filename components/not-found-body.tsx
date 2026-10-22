"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Strings = { title: string; body: string; home: string };

/** The root 404 cannot know the locale on the server; pick the strings from the URL. */
export function NotFoundBody({ vi, en }: { vi: Strings; en: Strings }) {
  const first = usePathname().split("/")[1];
  const t = first === "en" ? en : vi;
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
      <h1 className="text-[28px] font-semibold text-ink">{t.title}</h1>
      <p className="mt-3 text-muted">{t.body}</p>
      <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
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
