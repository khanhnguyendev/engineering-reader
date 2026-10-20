import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  CompaniesSchema,
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
};

function readJson(root: string, file: string): unknown {
  return JSON.parse(readFileSync(path.join(root, file), 'utf8'));
}

export function loadVocab(root = 'content'): Vocab {
  return {
    companies: CompaniesSchema.parse(readJson(root, 'companies.json')),
    topics: TopicsSchema.parse(readJson(root, 'topics.json')),
    tags: TagsSchema.parse(readJson(root, 'tags.json')),
    series: SeriesSchema.parse(readJson(root, 'series.json')),
    sourceHosts: SourceHostsSchema.parse(readJson(root, 'source-hosts.json')),
  };
}
