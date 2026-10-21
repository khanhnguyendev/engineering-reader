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
): Promise<{ content: ReactElement; headings: Heading[] }> {
  const doc = post.locales[locale];
  if (!doc) throw new Error(`No ${locale} document for ${post.slug}`);
  const headings: Heading[] = [];
  const { content } = await compileMDX({
    source: doc.body,
    components: {
      ...mdxComponents,
      Mermaid: (props: { index: number | string }) => (
        <Mermaid index={props.index} post={post} locale={locale} />
      ),
    },
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkRefs, remarkMermaid],
        rehypePlugins: [
          [
            rehypePrettyCode,
            { theme: { light: 'github-light', dark: 'github-dark-dimmed' }, keepBackground: false },
          ],
          [rehypeSections, { headings }],
        ],
      },
    },
  });
  return { content, headings };
}
