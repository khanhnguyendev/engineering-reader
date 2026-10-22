import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { LOCALES, type Locale } from '../i18n';
import type { Vocab } from './vocab';

// Loaded by next.config.ts, so nothing in this file's import chain may use the `@/` alias.
export const RedirectsSchema = z.array(
  z.object({
    from: z
      .string()
      .regex(/^\/[^:*?()+{}\s]*$/)
      .refine((s) => s === '/' || !s.endsWith('/'), 'no trailing slash'),
    to: z.string().regex(/^\/(?![\/\\])[^\s\\]*$/, 'internal path only'),
    permanent: z.boolean().default(true),
  }),
);
export type Redirect = z.infer<typeof RedirectsSchema>[number];

export function readRedirects(file = 'content/redirects.json'): Redirect[] {
  return RedirectsSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
}

type RoutePost = { slug: string; locales: Partial<Record<Locale, unknown>> };

/** Every URL the site serves itself; a redirect `from` here would shadow a real page. */
export function staticRoutes(posts: readonly RoutePost[], vocab: Vocab): Set<string> {
  const out = new Set<string>(['/']);
  for (const l of LOCALES) {
    out.add(`/${l}`);
    for (const p of posts) if (p.locales[l] !== undefined) out.add(`/${l}/posts/${p.slug}`);
    out.add(`/${l}/companies`);
    for (const c of vocab.companies) out.add(`/${l}/companies/${c.slug}`);
    out.add(`/${l}/topics`);
    for (const t of vocab.topics) out.add(`/${l}/topics/${t.slug}`);
    out.add(`/${l}/tags`);
    for (const t of vocab.tags) out.add(`/${l}/tags/${t.slug}`);
    for (const key of Object.keys(vocab.series)) out.add(`/${l}/series/${key}`);
    out.add(`/${l}/about`);
  }
  return out;
}

export function toNextRedirects(list: readonly Redirect[]) {
  return list.map((r) => ({ source: r.from, destination: r.to, permanent: r.permanent }));
}
