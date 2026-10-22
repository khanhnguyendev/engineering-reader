import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  CompaniesSchema,
  FeaturedSchema,
  SeriesSchema,
  SourceHostsSchema,
  TagsSchema,
  TopicsSchema,
  type Company,
  type Series,
  type Tag,
  type Topic,
} from './schema';

export type Vocab = {
  companies: Company[];
  topics: Topic[];
  tags: Tag[];
  series: Record<string, Series>;
  sourceHosts: string[];
  /** Slugs for the home "start here" row, in order. `post.json.featured` is ignored. */
  featured: string[];
};

function readJson(root: string, file: string): unknown {
  return JSON.parse(readFileSync(path.join(root, file), 'utf8'));
}

export const VOCAB_ROOT = process.env.VOCAB_ROOT ?? 'content';

const vocabCache = new Map<string, Vocab>();

export function _resetVocabCache(): void {
  vocabCache.clear();
}

/** Memoized per root in production; `next dev` re-reads so vocab edits show up. */
export function loadVocab(root: string = VOCAB_ROOT): Vocab {
  const memo = process.env.NODE_ENV === 'production';
  const cached = memo ? vocabCache.get(root) : undefined;
  if (cached) return cached;
  const vocab = readVocab(root);
  if (memo) vocabCache.set(root, vocab);
  return vocab;
}

function readVocab(root: string): Vocab {
  return {
    companies: CompaniesSchema.parse(readJson(root, 'companies.json')),
    topics: TopicsSchema.parse(readJson(root, 'topics.json')),
    tags: TagsSchema.parse(readJson(root, 'tags.json')),
    series: SeriesSchema.parse(readJson(root, 'series.json')),
    sourceHosts: SourceHostsSchema.parse(readJson(root, 'source-hosts.json')),
    featured: FeaturedSchema.parse(readJson(root, 'featured.json')),
  };
}
