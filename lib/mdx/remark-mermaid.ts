type Node = { type: string; lang?: string | null; children?: Node[]; [k: string]: unknown };

/** Replaces the i-th ```mermaid fence with <Mermaid index="i" />. */
export default function remarkMermaid() {
  return (tree: Node) => {
    let i = 0;
    const walk = (node: Node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.type === 'code' && child.lang === 'mermaid') {
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
