import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { readRawPost } from '../lib/content/load';
import { SeenSchema } from '../lib/content/schema';
import { ledgerCounts, postToPrPost, prBody } from '../lib/pipeline/pr-body';

const slugs: string[] = [];
let note: string | undefined;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--note') note = args[++i];
  else slugs.push(args[i]);
}

let baseText: string;
try {
  baseText = execFileSync('git', ['show', 'origin/main:content/seen.json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (e) {
  const err = e as { stderr?: Buffer | string; message: string };
  console.error(err.stderr ? String(err.stderr) : err.message);
  process.exit(1);
}
const base = SeenSchema.parse(JSON.parse(baseText));
const current = SeenSchema.parse(JSON.parse(readFileSync('content/seen.json', 'utf8')));
const posts = slugs.map((s) => postToPrPost(readRawPost(path.join('content/posts', s))));
process.stdout.write(prBody(posts, ledgerCounts(current, base), note));
