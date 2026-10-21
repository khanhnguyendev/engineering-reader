type Node = { type: string; lang?: string | null; position?: unknown; children?: Node[]; [k: string]: unknown };

/** Replaces the i-th ```mermaid fence with <Mermaid index="i" />. */
export default function remarkMermaid() {
  return (tree: Node, file?: { value?: unknown }) => {
    const source = typeof file?.value === 'string' ? file.value : undefined;
    // Only backtick fences count, matching mermaidBlocksOf in lib/content/load.ts.
    const isBacktickFence = (node: Node) => {
      const offset = (node.position as { start?: { offset?: number } } | undefined)?.start?.offset;
      return source === undefined || offset === undefined || source.startsWith('```', offset);
    };
    let i = 0;
    const walk = (node: Node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.type === 'code' && child.lang === 'mermaid' && isBacktickFence(child)) {
          return {
            type: 'mdxJsxFlowElement',
            name: 'Mermaid',
            attributes: [{ type: 'mdxJsxAttribute', name: 'index', value: String(i++) }],
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
