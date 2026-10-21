import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { LOCALES, type Locale } from '@/lib/i18n';
import { mermaidBlocksOf, type RawPost } from '@/lib/content/load';

export const MERMAID_THEME = {
  look: 'classic',
  theme: 'base',
  themeVariables: {
    primaryColor: '#010101',
    primaryTextColor: '#020202',
    primaryBorderColor: '#030303',
    lineColor: '#030303',
    secondaryColor: '#040404',
    tertiaryColor: '#040404',
    background: '#050505',
    secondaryBorderColor: '#030303',
    tertiaryBorderColor: '#030303',
    clusterBorder: '#030303',
    noteBorderColor: '#030303',
    arrowheadColor: '#030303',
    secondaryTextColor: '#020202',
    tertiaryTextColor: '#020202',
    titleColor: '#020202',
    noteTextColor: '#020202',
    noteBkgColor: '#040404',
    fontFamily: 'Inter, Arial, sans-serif',
  },
};

export const SENTINELS: Record<string, string> = {
  '#010101': 'var(--panel)',
  '#020202': 'var(--ink)',
  '#030303': 'var(--hairline-strong)',
  '#040404': 'var(--panel-2)',
  '#050505': 'transparent',
};

export type RenderStatus = 'missing' | 'stale' | 'fresh';
export type RenderPlan = {
  locale: Locale;
  index: number;
  src: string;
  file: string;
  status: RenderStatus;
};

/** Bump whenever postProcessSvg changes so committed SVGs go stale. */
export const POSTPROCESS_VERSION = 2;

export function hashBlock(src: string): string {
  return createHash('sha256')
    .update(src + JSON.stringify({ MERMAID_THEME, SENTINELS, POSTPROCESS_VERSION }))
    .digest('hex')
    .slice(0, 12);
}

export function svgName(locale: Locale, index: number): string {
  return `${locale}-diagram-${index + 1}.svg`;
}

export function readSvgHash(svg: string): string | undefined {
  const firstLine = svg.split('\n', 1)[0];
  return /^<!-- mermaid:([0-9a-f]+) -->\s*$/.exec(firstLine)?.[1];
}

const FILTER_DECL = /(?<![-\w])filter\s*:[^;}"<]*;?/gi;

export function postProcessSvg(svg: string, opts: { id: string }): string {
  let out = svg;
  for (const [hex, variable] of Object.entries(SENTINELS)) {
    out = out.replace(new RegExp(hex, 'gi'), variable);
  }
  out = out.replace(
    /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/gi,
    (m, r: string, g: string, b: string, a: string) => {
      const hex = '#' + [r, g, b].map((n) => Number(n).toString(16).padStart(2, '0')).join('');
      const variable = SENTINELS[hex];
      if (!variable) return m;
      const pct = Math.round(Number(a) * 10000) / 100;
      return `color-mix(in srgb, ${variable} ${pct}%, transparent)`;
    },
  );
  // Classic look should not emit these, but strip any that survive: no gradients, no glow.
  const gradientIds = [...out.matchAll(/<(?:linear|radial)Gradient\b[^>]*\bid="([^"]+)"/gi)].map((m) => m[1]);
  out = out.replace(/<(linearGradient|radialGradient)\b(?:[^>]*\/>|[\s\S]*?<\/\1>)/gi, '');
  for (const id of gradientIds) {
    const ref = `url\\(\\s*#${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\)`;
    out = out.replace(new RegExp(`(\\b(fill|stroke)\\s*(?:=\\s*"|:\\s*))${ref}`, 'gi'), (_m, lead: string, prop: string) =>
      `${lead}${prop.toLowerCase() === 'fill' ? 'var(--panel)' : 'var(--hairline-strong)'}`,
    );
    out = out.replace(new RegExp(ref, 'gi'), 'var(--hairline-strong)');
  }
  out = out.replace(/<filter\b[^>]*>[\s\S]*?<\/filter>/gi, '');
  out = out.replace(/\sfilter="\s*url\(#[^"]*"/gi, '');
  out = out.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, (b) => b.replace(FILTER_DECL, ''));
  out = out.replace(/\sstyle="[^"]*"/gi, (a) => a.replace(FILTER_DECL, ''));
  out = out.replace(/\sstyle="\s*"/gi, '');
  return out.replace(/<svg\b([^>]*)>/, (_m, attrs: string) => {
    const rest = attrs.replace(/\sid="[^"]*"/, '');
    return `<svg id="${opts.id}"${rest}>`;
  });
}

/** Colours left in a processed SVG that are not sentinel variables. */
export function leftoverColors(svg: string): string[] {
  const scanned = svg.replace(/<(style|filter)\b[\s\S]*?<\/\1>/gi, '');
  const found = scanned.match(/(?<![&\w])#[0-9a-fA-F]{3,6}(?![\w-])|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/g) ?? [];
  return [...new Set(found)];
}

export function planRenders(raw: RawPost): RenderPlan[] {
  const plans: RenderPlan[] = [];
  for (const locale of LOCALES) {
    const rl = raw.locales[locale];
    if (!rl || rl.draft) continue;
    const blocks = mermaidBlocksOf(rl.body);
    blocks.forEach((src, index) => {
      const file = path.join(raw.dir, svgName(locale, index));
      let status: RenderStatus;
      if (!existsSync(file)) status = 'missing';
      else status = readSvgHash(readFileSync(file, 'utf8')) === hashBlock(src) ? 'fresh' : 'stale';
      plans.push({ locale, index, src, file, status });
    });
  }
  return plans;
}
