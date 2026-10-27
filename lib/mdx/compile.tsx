import type { ReactElement } from 'react';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode from 'rehype-pretty-code';
import type { Locale } from '@/lib/i18n';
import type { PostRecord } from '@/lib/content/load';
import { mdxComponents } from '@/components/mdx/components';
import { Mermaid } from '@/components/mdx/mermaid';
import remarkRefs from '@/lib/mdx/remark-refs';
import remarkMermaid from '@/lib/mdx/remark-mermaid';
import rehypeSections, { type Heading } from '@/lib/mdx/rehype-sections';

export async function compilePostBody(
  post: PostRecord,
  locale: Locale,
  permalinkLabel?: string,
): Promise<{ content: ReactElement; headings: Heading[] }> {
  const doc = post.locales[locale];
  if (!doc) throw new Error(`No ${locale} document for ${post.slug}`);
  const headings: Heading[] = [];
  const { content } = await compileMDX({
    source: doc.body,
    components: {
      ...mdxComponents,
      Mermaid: (props: { index: number | string; caption?: string }) => (
        <Mermaid index={props.index} caption={props.caption} post={post} locale={locale} />
      ),
    },
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkRefs, remarkMermaid],
        rehypePlugins: [
          [
            rehypePrettyCode,
            { theme: { light: 'github-light', dark: 'github-dark-dimmed' }, keepBackground: false, defaultLang: { block: 'plaintext' } },
          ],
          [rehypeSections, { headings, permalinkLabel }],
        ],
      },
    },
  });
  return { content, headings };
}

/** A static page body (about): GFM and section anatomy only, so `[S1]` stays literal text. */
export async function compilePage(
  markdown: string,
  _locale: Locale,
  permalinkLabel?: string,
): Promise<{ content: ReactElement; headings: Heading[] }> {
  const headings: Heading[] = [];
  const { content } = await compileMDX({
    source: markdown,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [[rehypeSections, { headings, permalinkLabel }]],
      },
    },
  });
  return { content, headings };
}
