import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { loadVocab } from '../lib/content/vocab';
import { validateAll, type Finding } from '../lib/content/validate';

const root = process.argv[2] ?? 'content/posts';
const today = new Date().toLocaleDateString('en-CA');

const { findings, ok } = validateAll(root, loadVocab('content'), { today });

if (findings.length === 0) {
  const n = existsSync(root)
    ? readdirSync(root).filter((d) => existsSync(path.join(root, d, 'post.json'))).length
    : 0;
  console.log(`✔ ${n} posts valid`);
} else {
  const bySlug = new Map<string, Finding[]>();
  for (const f of findings) bySlug.set(f.slug, [...(bySlug.get(f.slug) ?? []), f]);
  for (const [slug, list] of bySlug) {
    for (const f of list) {
      const mark = f.level === 'error' ? '✖' : '⚠';
      console.log(`${mark} ${slug} — [${f.rule}] ${f.file ? `${f.file}: ` : ''}${f.message}`);
    }
  }
  const errors = findings.filter((f) => f.level === 'error').length;
  console.log(`\n${errors} error(s), ${findings.length - errors} warning(s)`);
}
process.exit(ok ? 0 : 1);
