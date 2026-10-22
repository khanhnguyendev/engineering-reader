import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Locale } from '@/lib/i18n';

/** DESIGN.md light tokens. The card is light regardless of the site theme. */
const C = {
  ground: '#f2f4f3',
  panel: '#ffffff',
  ink: '#111827',
  ink2: '#374151',
  muted: '#55606b',
  hairlineStrong: 'rgba(15, 122, 90, 0.4)',
  accent: '#0f7a5a',
};

/**
 * `pct`% of `a` plus the rest of `b`, plain sRGB. Satori has no color-mix, so
 * this stands in for the site's `color-mix(brand 70%, ink)` monogram colour.
 */
export function mixHex(a: string, b: string, pct: number): string {
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [rgb(a), rgb(b)];
  const out = x.map((v, i) => Math.round((v * pct) / 100 + y[i] * (1 - pct / 100)));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

type OgFont = { name: string; data: Buffer; weight: 400 | 600 | 700; style: 'normal' };

const FONT_FILES: { name: string; file: string; weight: OgFont['weight'] }[] = [
  { name: 'Inter', file: 'Inter-Regular.ttf', weight: 400 },
  { name: 'Inter', file: 'Inter-SemiBold.ttf', weight: 600 },
  { name: 'Inter', file: 'Inter-Bold.ttf', weight: 700 },
  { name: 'JetBrains Mono', file: 'JetBrainsMono-Bold.ttf', weight: 700 },
];

/** Static TTFs from the repo (satori reads TTF/OTF, not woff2); Inter covers U+1EA0 to U+1EF9. */
export function loadOgFonts(): OgFont[] {
  return FONT_FILES.map(({ name, file, weight }) => ({
    name,
    weight,
    style: 'normal',
    data: readFileSync(path.join(process.cwd(), 'assets/og', file)),
  }));
}

export type OgCardProps = {
  kind: 'post' | 'site';
  locale: Locale;
  title: string;
  companyName?: string;
  brandColor?: string;
  keyNumber?: { value: string; label: string };
  tagline: string;
  siteName: string;
};

/** Rough line count for the 56px title in the 992px text column. */
export const LONG_TITLE_CHARS = 60;

export function OgCard(p: OgCardProps) {
  const post = p.kind === 'post';
  const titleSize = p.title.length > LONG_TITLE_CHARS ? 48 : 56;
  const letter = (p.companyName ?? p.siteName).trim().charAt(0).toUpperCase();
  const mark = mixHex(p.brandColor ?? C.accent, C.ink, 70);
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        padding: 48,
        backgroundColor: C.ground,
        fontFamily: 'Inter',
        color: C.ink,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          padding: '40px 56px',
          backgroundColor: C.panel,
          border: `1px solid ${C.hairlineStrong}`,
          borderRadius: 10,
        }}
      >
        {post ? (
          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  border: `1px solid ${C.hairlineStrong}`,
                  color: mark,
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                {letter}
              </div>
              <div style={{ display: 'flex', marginLeft: 14, fontSize: 26, fontWeight: 600, color: C.ink2 }}>
                {p.companyName}
              </div>
            </div>
            <div
              style={{
                display: 'block',
                marginTop: 28,
                fontSize: titleSize,
                lineClamp: 3,
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
              }}
            >
              {p.title}
            </div>
            {p.keyNumber ? (
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', paddingTop: 28 }}>
                <div
                  style={{
                    display: 'flex',
                    fontFamily: 'JetBrains Mono',
                    fontWeight: 700,
                    fontSize: 64,
                    lineHeight: 1.1,
                  }}
                >
                  {p.keyNumber.value}
                </div>
                <div style={{ display: 'flex', marginTop: 6, fontSize: 24, color: C.ink2 }}>
                  {p.keyNumber.label}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }}>
            <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {p.siteName}
            </div>
            <div style={{ display: 'flex', marginTop: 16, fontSize: 32, color: C.ink2 }}>{p.tagline}</div>
          </div>
        )}
        <div style={{ display: 'flex', height: 1, marginTop: 24, backgroundColor: C.accent }} />
        {post ? (
          <div style={{ display: 'flex', marginTop: 16, fontSize: 22, color: C.muted }}>{p.tagline}</div>
        ) : null}
      </div>
    </div>
  );
}
