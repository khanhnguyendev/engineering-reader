import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { LOCALES, type Locale } from '@/lib/i18n';
import type { RawPost } from '@/lib/content/load';

export const MERMAID_THEME = {
  theme: 'base',
  themeVariables: {
    primaryColor: '#010101',
    primaryTextColor: '#020202',
    primaryBorderColor: '#030303',
    lineColor: '#030303',
    secondaryColor: '#040404',
    tertiaryColor: '#040404',
    background: '#050505',
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

export function hashBlock(src: string): string {
  return createHash('sha256')
    .update(src + JSON.stringify(MERMAID_THEME))
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

export function postProcessSvg(svg: string, opts: { id: string }): string {
  let out = svg;
  for (const [hex, variable] of Object.entries(SENTINELS)) {
    out = out.replace(new RegExp(hex, 'gi'), variable);
  }
  return out.replace(/<svg\b([^>]*)>/, (_m, attrs: string) => {
    const rest = attrs.replace(/\sid="[^"]*"/, '');
    return `<svg id="${opts.id}"${rest}>`;
  });
}

export function planRenders(raw: RawPost): RenderPlan[] {
  const plans: RenderPlan[] = [];
  for (const locale of LOCALES) {
    const rl = raw.locales[locale];
    if (!rl || rl.draft) continue;
    const blocks = [...rl.body.matchAll(/```mermaid[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1].trim());
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
