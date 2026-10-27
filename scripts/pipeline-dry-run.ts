import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { readRawPost } from '../lib/content/load';
import { SeenSchema } from '../lib/content/schema';
import { isValidSlug, prepareDryRun } from '../lib/pipeline/dry-run';
import { ledgerCounts, postToPrPost, prBody } from '../lib/pipeline/pr-body';

const FIXTURE = 'tests/fixtures/posts/good-post';
const ROOT = 'content';
const NOTE = `Dry run from ${FIXTURE}. Do not merge; close after CI.`;

const today = new Date().toLocaleDateString('en-CA');
let slug: string | undefined = `dry-run-${today}`;
let base = 'main';
let openPr = false;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--slug') slug = args[++i];
  else if (args[i] === '--base') base = args[++i];
  else if (args[i] === '--open-pr') openPr = true;
}
if (!isValidSlug(slug)) {
  console.error('invalid --slug');
  process.exit(1);
}
if (!base) {
  console.error('invalid --base');
  process.exit(1);
}
const slugOk: string = slug;

const git = (...a: string[]) => execFileSync('git', a, { encoding: 'utf8' }).trim();

function validate(): void {
  const r = spawnSync('pnpm', ['validate'], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('pnpm validate failed');
}

// Like scripts/pipeline-pr-body.ts: no fallback; a missing base ledger is an error.
function body(postDir: string, baseBranch: string): string {
  const baseText = execFileSync('git', ['show', `origin/${baseBranch}:content/seen.json`], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const baseSeen = SeenSchema.parse(JSON.parse(baseText));
  const current = SeenSchema.parse(JSON.parse(readFileSync(path.join(ROOT, 'seen.json'), 'utf8')));
  return prBody([postToPrPost(readRawPost(postDir))], ledgerCounts(current, baseSeen), NOTE);
}

const target = path.join(ROOT, 'posts', slugOk);

if (!openPr) {
  try {
    const { postDir } = prepareDryRun({ fixtureDir: FIXTURE, contentRoot: ROOT, slug: slugOk, today });
    validate();
    process.stdout.write(body(postDir, 'main'));
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
  if (original === 'HEAD') {
    console.error('detached HEAD; switch to a branch first');
    process.exit(1);
  }
  if (original !== base) console.log(`branching from ${original}; PR base ${base}`);
  const branch = `pipeline/dry-run-${today}`;
  const title = `content: pipeline dry run ${slugOk}`;
  const preexisting = existsSync(target);
  let switched = false;
  let pushed = false;
  let prUrl: string | undefined;
  try {
    git('switch', '-c', branch);
    switched = true;
    const { postDir } = prepareDryRun({ fixtureDir: FIXTURE, contentRoot: ROOT, slug: slugOk, today });
    validate();
    const prBodyText = body(postDir, base);
    const msg = ['commit', '-m', title];
    if (process.env.GIT_TRAILERS) msg.push('-m', process.env.GIT_TRAILERS);
    git('add', ROOT);
    git(...msg);
    git('push', '-u', 'origin', 'HEAD');
    pushed = true;
    prUrl = execFileSync(
      'gh',
      ['pr', 'create', '--base', base, '--title', title, '--body', prBodyText],
      { encoding: 'utf8' },
    ).trim();
    console.log(prUrl);
  } catch (e) {
    console.error((e as Error).message);
    const step = (f: () => void) => {
      try {
        f();
      } catch (e2) {
        console.error(`cleanup failed: ${(e2 as Error).message}`);
      }
    };
    if (pushed) step(() => void git('push', 'origin', '--delete', branch));
    if (switched) {
      if (!preexisting) step(() => rmSync(target, { recursive: true, force: true }));
      step(() => void git('checkout', '--', `${ROOT}/seen.json`));
      step(() => void git('switch', '-f', original));
      step(() => void git('branch', '-D', branch));
    }
    process.exit(1);
  }
  try {
    git('switch', original);
  } catch (e) {
    console.error(`PR was already opened (${prUrl}); could not switch back to ${original}: ${(e as Error).message}`);
    process.exit(1);
  }
}
