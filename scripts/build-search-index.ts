import { rmSync } from 'node:fs';
import * as pagefind from 'pagefind';
import { listPosts } from '@/lib/content/load';
import { loadVocab } from '@/lib/content/vocab';
import { searchRecords } from '@/lib/search-records';

const OUT = 'public/pagefind';

async function main(): Promise<number> {
  rmSync(OUT, { recursive: true, force: true });
  const records = searchRecords(listPosts(), loadVocab());
  const counts: Record<string, number> = { vi: 0, en: 0 };
  for (const r of records) counts[r.language]++;

  const { index, errors: createErrors } = await pagefind.createIndex({});
  const errors = [...createErrors];
  if (!index) {
    console.error(`✖ search index: could not create index\n${errors.join('\n')}`);
    return 1;
  }
  for (const r of records) {
    const res = await index.addCustomRecord(r);
    errors.push(...res.errors);
  }
  const written = await index.writeFiles({ outputPath: OUT });
  errors.push(...written.errors);
  await pagefind.close();

  console.log(`✔ search index: Indexed ${records.length} records (vi ${counts.vi}, en ${counts.en}) -> ${OUT}`);
  let bad = false;
  for (const [lang, n] of Object.entries(counts)) {
    if (n === 0) {
      console.error(`✖ search index: 0 records for "${lang}"`);
      bad = true;
    }
  }
  if (errors.length) {
    console.error(`✖ search index errors:\n${errors.join('\n')}`);
    bad = true;
  }
  return bad ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
