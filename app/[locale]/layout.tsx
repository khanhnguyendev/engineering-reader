import { ThemeScript } from "@/components/theme-script";
import { earlyStartScript } from "@/lib/search-preload";
import { Analytics } from "@vercel/analytics/next";
import { fontVariables } from "../fonts";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "vi" }, { locale: "en" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <html
      lang={locale}
      className={fontVariables}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        <script dangerouslySetInnerHTML={{ __html: earlyStartScript() }} />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
