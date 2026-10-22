import { LOCALES, isLocale } from '@/lib/i18n';
import { CONTENT_ROOT, getPost, hasLocale, listPosts } from '@/lib/content/load';
import { loadVocab } from '@/lib/content/vocab';
import { getDictionary } from '@/lib/dictionaries';
import { postMarkdown } from '@/lib/markdown';
import { SITE_URL } from '@/lib/site';

export const dynamicParams = false;
export const dynamic = 'force-static';

type Params = Promise<{ locale: string; file: string }>;

// Reached through the `/:locale/posts/:file.md` rewrite in next.config.ts.
export function generateStaticParams() {
  return listPosts(CONTENT_ROOT).flatMap((post) =>
    LOCALES.filter((locale) => hasLocale(post, locale)).map((locale) => ({ locale, file: `${post.slug}.md` })),
  );
}

export async function GET(_req: Request, { params }: { params: Params }) {
  const { locale, file } = await params;
  const slug = file.endsWith('.md') ? file.slice(0, -3) : '';
  const post = isLocale(locale) && slug ? getPost(CONTENT_ROOT, slug) : undefined;
  if (!isLocale(locale) || !post || !hasLocale(post, locale)) return new Response('Not found', { status: 404 });
  const body = postMarkdown(post, locale, loadVocab(), getDictionary(locale), SITE_URL);
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Robots-Tag': 'noindex',
      Link: `<${SITE_URL}/${locale}/posts/${slug}>; rel="canonical"`,
    },
  });
}
