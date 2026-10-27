type Node = { type: string; lang?: string | null; meta?: string | null; position?: unknown; children?: Node[]; [k: string]: unknown };

/** Reads caption="…" from a fence meta string. */
export function captionFromMeta(meta?: string | null): string | undefined {
  const m = /(?:^|\s)caption="([^"]*)"/.exec(meta ?? '');
  const text = m?.[1].trim();
  return text ? text : undefined;
}

/** Replaces the i-th ```mermaid fence with <Mermaid index="i" />. */
export default function remarkMermaid() {
  return (tree: Node, file?: { value?: unknown }) => {
    const source = typeof file?.value === 'string' ? file.value : undefined;
    // Only backtick fences count, matching mermaidBlocksOf in lib/content/load.ts.
    const isBacktickFence = (node: Node) => {
      const offset = (node.position as { start?: { offset?: number } } | undefined)?.start?.offset;
      if (source === undefined || offset === undefined) return true;
      return (
        (offset === 0 || source[offset - 1] === '\n') &&
        source.startsWith('```', offset) &&
        source[offset + 3] !== '`'
      );
    };
    let i = 0;
    const walk = (node: Node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.type === 'code' && child.lang === 'mermaid' && isBacktickFence(child)) {
          const attributes = [{ type: 'mdxJsxAttribute', name: 'index', value: String(i++) }];
          const caption = captionFromMeta(child.meta);
          if (caption) attributes.push({ type: 'mdxJsxAttribute', name: 'caption', value: caption });
          return {
            type: 'mdxJsxFlowElement',
            name: 'Mermaid',
            attributes,
            children: [],
          };
        }
        walk(child);
        return child;
      });
    };
    walk(tree);
  };
}
