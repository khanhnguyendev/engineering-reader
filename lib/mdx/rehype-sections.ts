type Node = {
  type: string;
  tagName?: string;
  value?: string;
  name?: string;
  attributes?: Array<{ name?: string; value?: unknown }>;
  properties?: Record<string, unknown>;
  children?: Node[];
};

export type Heading = { id: string; text: string };

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function textOf(node: Node): string {
  if (node.type === 'text') return node.value ?? '';
  if (node.type === 'mdxJsxTextElement' && node.name === 'Ref') {
    const attr = (n: string) => node.attributes?.find((a) => a.name === n)?.value;
    const id = attr('id');
    const locator = attr('locator');
    if (typeof id !== 'string') return '';
    return `[${id}${typeof locator === 'string' && locator ? ' ' + locator : ''}]`;
  }
  return (node.children ?? []).map(textOf).join('');
}

const isH2 = (n: Node) => n.type === 'element' && n.tagName === 'h2';

/** Wraps each h2 and its following siblings in <section class="panel" id>.
 * The id lives on the section only, to avoid duplicate ids in the document. */
export default function rehypeSections(options: { headings?: Heading[] } = {}) {
  return (tree: Node) => {
    const children = tree.children ?? [];
    const out: Node[] = [];
    const seen = new Set<string>();
    let current: Node | null = null;
    for (const node of children) {
      if (isH2(node)) {
        const text = textOf(node).trim();
        const base = slugify(text) || 'section';
        let id = base;
        for (let n = 2; seen.has(id); n++) id = `${base}-${n}`;
        seen.add(id);
        options.headings?.push({ id, text });
        current = {
          type: 'element',
          tagName: 'section',
          properties: { className: ['panel'], id },
          children: [node],
        };
        out.push(current);
      } else if (current) {
        current.children!.push(node);
      } else {
        out.push(node);
      }
    }
    tree.children = out;
  };
}
