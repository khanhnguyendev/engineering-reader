import { z } from 'zod';
import { LOCALES } from '@/lib/i18n';

export const TOPICS = ['distributed-systems', 'data', 'realtime', 'infra', 'reliability'] as const;
export const CASE_TYPES = ['migration', 'incident', 'design-decision', 'scaling'] as const;

const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
const Slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const SourceSchema = z.object({
  id: z.string().regex(/^S\d+$/, 'source id must look like S1, S2, ...'),
  type: z.enum(['blog', 'talk', 'paper']),
  title: z.string().min(1),
  authors: z.array(z.string()),
  publishedAt: DateStr,
  url: z.url({ protocol: /^https$/ }),
  accessedAt: DateStr,
  locator: z.string().nullable(),
});

export const KeyNumberSchema = z.object({
  id: z.string().min(1),
  value: z.string().min(1),
  ref: z.string().min(1),
});

export const PostJsonSchema = z
  .strictObject({
    slug: Slug,
    company: z.string().min(1),
    topic: z.enum(TOPICS),
    caseType: z.enum(CASE_TYPES),
    tags: z.array(z.string()).min(2).max(5),
    series: z.string().nullable(),
    publishedAt: DateStr,
    updatedAt: DateStr.nullable(),
    sourcePublishedAt: DateStr,
    featured: z.boolean(),
    author: z.string().min(1),
    reviewedBy: z.string().min(1),
    keyNumbers: z.array(KeyNumberSchema).min(2).max(4),
    sources: z.array(SourceSchema).min(1),
  })
  .superRefine((post, ctx) => {
    const dupes = (key: 'keyNumbers' | 'sources', ids: string[]) => {
      const seen = new Set<string>();
      ids.forEach((id, i) => {
        if (seen.has(id)) {
          ctx.addIssue({ code: 'custom', path: [key, i, 'id'], message: `duplicate id "${id}"` });
        }
        seen.add(id);
      });
    };
    dupes('keyNumbers', post.keyNumbers.map((k) => k.id));
    dupes('sources', post.sources.map((s) => s.id));
    post.sources.forEach((s, i) => {
      if ((s.type === 'talk' || s.type === 'paper') && !s.locator) {
        ctx.addIssue({
          code: 'custom',
          path: ['sources', i, 'locator'],
          message: `locator is required for ${s.type} sources`,
        });
      }
    });
  });

const codePoints = (s: string) => Array.from(s.normalize('NFC')).length;

export const LocaleFrontmatterSchema = z.strictObject({
  title: z.string().min(1),
  summary: z.string().refine((s) => codePoints(s) <= 160, 'summary must be at most 160 code points'),
  tldr: z.array(z.string().min(1)).min(3).max(5),
  keyNumberLabels: z.record(z.string(), z.string()),
  smallTeam: z.array(z.string().min(1)).min(2).max(4),
  lessons: z.array(z.string().min(1)).min(2).max(3).optional(),
  draft: z.boolean().optional(),
});

export const CompanySchema = z.object({
  slug: Slug,
  name: z.string().min(1),
  blogUrl: z.string().url(),
  feedUrl: z.string().url().nullable(),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logo: z.string().min(1),
});
export const CompaniesSchema = z.array(CompanySchema);

const LabelShape = Object.fromEntries(LOCALES.map((l) => [l, z.string().min(1)])) as Record<
  (typeof LOCALES)[number],
  z.ZodString
>;
const TaxonomyEntry = z.object({ slug: Slug, ...LabelShape });
export const TopicsSchema = z.array(TaxonomyEntry);
export const TagsSchema = z.array(TaxonomyEntry);

export const SeriesSchema = z.record(
  z.string(),
  z.object({ slugs: z.array(z.string()), ...LabelShape }),
);
export const SourceHostsSchema = z.array(z.string().min(1));

export type PostJson = z.infer<typeof PostJsonSchema>;
export type LocaleFrontmatter = z.infer<typeof LocaleFrontmatterSchema>;
export type Company = z.infer<typeof CompanySchema>;
export type Source = z.infer<typeof SourceSchema>;
export type KeyNumber = z.infer<typeof KeyNumberSchema>;
export type Topic = z.infer<typeof TaxonomyEntry>;
export type Tag = Topic;
export type Series = z.infer<typeof SeriesSchema>[string];
