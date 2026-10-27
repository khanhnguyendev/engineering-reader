import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { readRawPost } from '../lib/content/load';
import { SeenSchema } from '../lib/content/schema';
import { prepareDryRun } from '../lib/pipeline/dry-run';
import { ledgerCounts, postToPrPost, prBody } from '../lib/pipeline/pr-body';

const FIXTURE = 'tests/fixtures/posts/good-post';
const ROOT = 'content';
const NOTE = `Dry run from ${FIXTURE}. Do not merge; close after CI.`;

const today = new Date().toLocaleDateString('en-CA');
let slug = `dry-run-${today}`;
let base = 'main';
let openPr = false;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--slug') slug = args[++i];
  else if (args[i] === '--base') base = args[++i];
  else if (args[i] === '--open-pr') openPr = true;
}

const git = (...a: string[]) => execFileSync('git', a, { encoding: 'utf8' }).trim();

function validate(): void {
  const r = spawnSync('pnpm', ['validate'], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('pnpm validate failed');
}

function body(postDir: string): string {
  let baseText: string;
  try {
    baseText = git('show', 'origin/main:content/seen.json');
  } catch {
    baseText = '{}';
  }
  const baseSeen = SeenSchema.parse(JSON.parse(baseText));
  const current = SeenSchema.parse(JSON.parse(readFileSync(path.join(ROOT, 'seen.json'), 'utf8')));
  return prBody([postToPrPost(readRawPost(postDir))], ledgerCounts(current, baseSeen), NOTE);
}

if (!openPr) {
  try {
    const { postDir } = prepareDryRun({ fixtureDir: FIXTURE, contentRoot: ROOT, slug, today });
    validate();
    process.stdout.write(body(postDir));
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
} else {
  if (git('status', '--porcelain') !== '') {
    console.error('working tree is not clean');
    process.exit(1);
  }
  const original = git('rev-parse', '--abbrev-ref', 'HEAD');
  const branch = `pipeline/dry-run-${today}`;
  const title = `content: pipeline dry run ${slug}`;
  git('switch', '-c', branch);
  try {
    const { postDir } = prepareDryRun({ fixtureDir: FIXTURE, contentRoot: ROOT, slug, today });
    validate();
    const msg = ['commit', '-m', title];
    if (process.env.GIT_TRAILERS) msg.push('-m', process.env.GIT_TRAILERS);
    git('add', ROOT);
    git(...msg);
    git('push', '-u', 'origin', 'HEAD');
    const url = execFileSync(
      'gh',
      ['pr', 'create', '--base', base, '--title', title, '--body', body(postDir)],
      { encoding: 'utf8' },
    ).trim();
    console.log(url);
    git('switch', original);
  } catch (e) {
    console.error((e as Error).message);
    try {
      rmSync(path.join(ROOT, 'posts', slug), { recursive: true, force: true });
      git('checkout', '--', `${ROOT}/seen.json`);
      git('switch', '-f', original);
      git('branch', '-D', branch);
    } catch (e2) {
      console.error(`cleanup failed: ${(e2 as Error).message}`);
    }
    process.exit(1);
  }
}
