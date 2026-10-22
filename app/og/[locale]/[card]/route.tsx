import { ImageResponse } from 'next/og';
import { LOCALES, isLocale } from '@/lib/i18n';
import { CONTENT_ROOT, getPost, hasLocale, listPosts } from '@/lib/content/load';
import { loadVocab } from '@/lib/content/vocab';
import { getDictionary } from '@/lib/dictionaries';
import { OgCard, loadOgFonts, type OgCardProps } from '@/lib/og/card';

export const dynamicParams = false;
export const dynamic = 'force-static';

type Params = Promise<{ locale: string; card: string }>;

export function generateStaticParams() {
  const posts = listPosts(CONTENT_ROOT);
  return LOCALES.flatMap((locale) => [
    { locale, card: 'site.png' },
    ...posts.filter((p) => hasLocale(p, locale)).map((p) => ({ locale, card: `${p.slug}.png` })),
  ]);
}

const notFound = () => new Response('Not found', { status: 404 });

export async function GET(_req: Request, { params }: { params: Params }) {
  const { locale, card } = await params;
  if (!isLocale(locale) || !card.endsWith('.png')) return notFound();
  const name = card.slice(0, -'.png'.length);
  const { site } = getDictionary(locale);
  let props: OgCardProps;
  if (name === 'site') {
    props = { kind: 'site', locale, title: site.name, tagline: site.tagline, siteName: site.name };
  } else {
    const post = getPost(CONTENT_ROOT, name);
    const doc = post?.locales[locale];
    if (!post || !doc) return notFound();
    const company = loadVocab().companies.find((c) => c.slug === post.meta.company);
    const first = post.meta.keyNumbers[0];
    props = {
      kind: 'post',
      locale,
      title: doc.frontmatter.title,
      companyName: company?.name ?? post.meta.company,
      brandColor: company?.brandColor,
      keyNumber: first
        ? { value: first.value, label: doc.frontmatter.keyNumberLabels[first.id] ?? '' }
        : undefined,
      tagline: site.tagline,
      siteName: site.name,
    };
  }
  return new ImageResponse(<OgCard {...props} />, { width: 1200, height: 630, fonts: loadOgFonts() });
}
