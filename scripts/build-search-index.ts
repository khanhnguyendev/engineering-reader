import { rmSync } from 'node:fs';
import * as pagefind from 'pagefind';
import { listPosts } from '@/lib/content/load';
import { loadVocab } from '@/lib/content/vocab';
import { searchRecords, verdict } from '@/lib/search-records';

const OUT = 'public/pagefind';

async function main(): Promise<number> {
  rmSync(OUT, { recursive: true, force: true });
  const records = searchRecords(listPosts(), loadVocab());
  const counts: Record<'vi' | 'en', number> = { vi: 0, en: 0 };
  for (const r of records) counts[r.language]++;

  const { index, errors: createErrors } = await pagefind.createIndex({});
  const errors = [...createErrors];
  if (!index) {
    console.error(`✖ search index: could not create index\n${errors.join('\n')}`);
    return 1;
  }
  try {
    for (const r of records) {
      const res = await index.addCustomRecord(r);
      errors.push(...res.errors);
    }
    const written = await index.writeFiles({ outputPath: OUT });
    errors.push(...written.errors);

    console.log(`✔ search index: Indexed ${records.length} records (vi ${counts.vi}, en ${counts.en}) -> ${OUT}`);
    const failures = verdict(counts, errors);
    for (const line of failures) console.error(line);
    return failures.length ? 1 : 0;
  } finally {
    await pagefind.close();
  }
}

main().then(
  (code) => process.exit(code),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
