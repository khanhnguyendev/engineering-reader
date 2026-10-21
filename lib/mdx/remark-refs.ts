type Node = { type: string; value?: string; children?: Node[]; [k: string]: unknown };

const REF = /\[(S\d+)(?:\s+([^\]]+))?\]/g;
const SKIP = new Set(['code', 'inlineCode', 'link', 'linkReference']);

function split(value: string): Node[] | null {
  const out: Node[] = [];
  let last = 0;
  for (const m of value.matchAll(REF)) {
    if (m.index > last) out.push({ type: 'text', value: value.slice(last, m.index) });
    const attributes = [{ type: 'mdxJsxAttribute', name: 'id', value: m[1] }];
    if (m[2]) attributes.push({ type: 'mdxJsxAttribute', name: 'locator', value: m[2].trim() });
    out.push({ type: 'mdxJsxTextElement', name: 'Ref', attributes, children: [] });
    last = m.index + m[0].length;
  }
  if (out.length === 0) return null;
  if (last < value.length) out.push({ type: 'text', value: value.slice(last) });
  return out;
}

/** Turns `[S1 §2]` in text into <Ref id="S1" locator="§2" />. */
export default function remarkRefs() {
  return (tree: Node) => {
    const walk = (node: Node) => {
      if (!node.children || SKIP.has(node.type)) return;
      node.children = node.children.flatMap((child) => {
        if (child.type === 'text' && typeof child.value === 'string') {
          return split(child.value) ?? [child];
        }
        walk(child);
        return [child];
      });
    };
    walk(tree);
  };
}
