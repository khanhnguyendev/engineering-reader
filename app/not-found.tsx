import type { Metadata } from "next";
import { Header } from "@/components/header";
import { NotFoundBody } from "@/components/not-found-body";
import { ThemeScript } from "@/components/theme-script";
import { getDictionary } from "@/lib/dictionaries";
import { fontVariables } from "./fonts";
import "./globals.css";

const viDict = getDictionary("vi");
export const metadata: Metadata = { title: `${viDict.notFound.title} · ${viDict.site.name}` };

// Unmatched URLs are served from the root, outside [locale]: this owns <html>.
// The server cannot know the path, so lang is vi and the body picks strings by URL.
export default function NotFound() {
  const vi = getDictionary("vi").notFound;
  const en = getDictionary("en").notFound;
  return (
    <html lang="vi" className={fontVariables} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <Header locale="vi" twinMissing pathless />
        <main id="content" tabIndex={-1}>
          <NotFoundBody vi={vi} en={en} siteNameEn={getDictionary("en").site.name} />
        </main>
      </body>
    </html>
  );
}
