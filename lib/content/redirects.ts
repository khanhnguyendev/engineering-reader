import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { endpointRoutes, pageEntries, type RoutePost } from './routes';
import type { Vocab } from './vocab';

// Loaded by next.config.ts, so nothing in this file's import chain may use the `@/` alias.
export const RedirectsSchema = z.array(
  z.object({
    from: z
      .string()
      .regex(/^\/[^:*?()+{}\s]*$/)
      .refine((s) => s === '/' || !s.endsWith('/'), 'no trailing slash'),
    to: z.string().regex(/^\/(?![\/\\])[^\s\\]*$/, 'internal path only'),
    permanent: z.boolean().optional(),
    statusCode: z.union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)]).optional(),
  })
    .refine((r) => !(r.permanent !== undefined && r.statusCode !== undefined), 'use permanent or statusCode, not both')
    .transform((r) => (r.statusCode === undefined ? { ...r, permanent: r.permanent ?? true } : r)),
);
export type Redirect = z.infer<typeof RedirectsSchema>[number];

export function readRedirects(file = 'content/redirects.json'): Redirect[] {
  return RedirectsSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
}

/** Every URL the site serves itself; a redirect `from` here would shadow a real page. */
export function staticRoutes(posts: readonly RoutePost[], vocab: Vocab): Set<string> {
  const out = new Set<string>(['/']);
  for (const e of pageEntries(posts, vocab)) {
    for (const l of e.locales) out.add(`/${l}${e.path}`);
  }
  for (const r of endpointRoutes(posts)) out.add(r);
  // `/feed.xml` is the legacy alias that redirects to `/vi/feed.xml`; it must stay a legal `from`.
  out.delete('/feed.xml');
  return out;
}

export function toNextRedirects(list: readonly Redirect[]) {
  return list.map((r) =>
    r.statusCode !== undefined
      ? { source: r.from, destination: r.to, statusCode: r.statusCode }
      : { source: r.from, destination: r.to, permanent: r.permanent ?? true },
  );
}
