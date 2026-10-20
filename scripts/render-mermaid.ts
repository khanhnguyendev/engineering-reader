import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readRawPost } from '../lib/content/load';
import { hashBlock, planRenders, postProcessSvg } from '../lib/content/mermaid';

const args = process.argv.slice(2);
const check = args.includes('--check');
const root = args.find((a) => !a.startsWith('--')) ?? 'content/posts';

const plans = (existsSync(root) ? readdirSync(root).sort() : [])
  .map((name) => path.join(root, name))
  .filter((dir) => existsSync(path.join(dir, 'post.json')))
  .flatMap((dir) => {
    const raw = readRawPost(dir);
    return planRenders(raw).map((p) => ({ slug: raw.slug, ...p }));
  });

const todo = plans.filter((p) => p.status !== 'fresh');

if (check) {
  for (const p of todo) console.log(`${p.slug} ${p.file} ${p.status}`);
  if (todo.length > 0) {
    console.log(`\n${todo.length} diagram(s) need rendering`);
    process.exit(1);
  }
  console.log(`✔ all diagrams fresh (${plans.length})`);
  process.exit(0);
}

const work = mkdtempSync(path.join(tmpdir(), 'mermaid-render-'));
try {
  for (const p of todo) {
    const id = `${p.slug}-${p.locale}-${p.index + 1}`;
    const inFile = path.join(work, `${id}.mmd`);
    const outFile = path.join(work, `${id}.svg`);
    writeFileSync(inFile, p.src);
    try {
      execFileSync(
        'pnpm',
        [
          'exec', 'mmdc', '-i', inFile, '-o', outFile, '-c', 'mermaid.config.json',
          '-p', 'puppeteer.json', '--svgId', id, '--backgroundColor', 'transparent',
        ],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      );
    } catch (e) {
      const err = e as { stdout?: string; stderr?: string };
      console.error(`✖ mmdc failed for ${p.slug} ${p.file}\n${err.stdout ?? ''}${err.stderr ?? ''}`);
      process.exit(1);
    }
    const svg = postProcessSvg(readFileSync(outFile, 'utf8'), { id });
    writeFileSync(p.file, `<!-- mermaid:${hashBlock(p.src)} -->\n${svg}`);
    console.log(`rendered ${p.slug} ${p.file} (${p.status})`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
console.log(`✔ ${todo.length} rendered, ${plans.length - todo.length} fresh (${plans.length} total)`);
