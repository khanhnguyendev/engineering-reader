import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Locale } from '@/lib/i18n';
import type { PostRecord } from '@/lib/content/load';
import { hashBlock, readSvgHash, svgName } from '@/lib/content/mermaid';

export type MermaidProps = { index: number | string; caption?: string; post: PostRecord; locale: Locale };

export function Mermaid({ index, caption, post, locale }: MermaidProps) {
  const i = Number(index);
  const src = post.locales[locale]?.mermaidBlocks[i] ?? '';
  const file = path.join(post.dir, svgName(locale, i));
  if (src && existsSync(file)) {
    const svg = readFileSync(file, 'utf8');
    if (readSvgHash(svg) === hashBlock(src)) {
      const html = svg.slice(svg.indexOf('\n') + 1);
      return (
        <figure className="diagram">
          <div dangerouslySetInnerHTML={{ __html: html }} />
          {caption ? <figcaption className="mt-2 text-[13px] leading-[1.45] text-muted">{caption}</figcaption> : null}
        </figure>
      );
    }
  }
  return (
    <pre className="diagram-fallback">
      <code className="language-mermaid">{src}</code>
    </pre>
  );
}
