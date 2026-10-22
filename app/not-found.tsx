import type { Metadata } from "next";
import { Header } from "@/components/header";
import { NotFoundBody } from "@/components/not-found-body";
import { ThemeScript } from "@/components/theme-script";
import { getDictionary } from "@/lib/dictionaries";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = { title: getDictionary("vi").notFound.title };

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
        <Header locale="vi" twinMissing />
        <main id="content" tabIndex={-1}>
          <NotFoundBody vi={vi} en={en} />
        </main>
      </body>
    </html>
  );
}
