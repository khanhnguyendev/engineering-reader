import { execFileSync } from 'node:child_process';
import { formatShadowStatus, shadowStatus, type PipelinePr } from '../lib/pipeline/shadow-status';

let out: string;
try {
  out = execFileSync(
    'gh',
    [
      'pr',
      'list',
      '--label',
      'pipeline',
      '--state',
      'all',
      '--limit',
      '500',
      '--json',
      'number,headRefName,createdAt,mergedAt,labels',
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
} catch (e) {
  const err = e as { stderr?: Buffer | string; message: string };
  console.error(err.stderr ? String(err.stderr) : err.message);
  process.exit(1);
}

type RawPr = Omit<PipelinePr, 'labels'> & { labels: { name: string }[] };
let raw: RawPr[];
try {
  raw = JSON.parse(out) as RawPr[];
} catch {
  console.error('shadow-status: could not parse gh output as JSON');
  process.exit(1);
}
const prs: PipelinePr[] = raw.map((p) => ({ ...p, labels: p.labels.map((l) => l.name) }));
const today = new Date().toISOString().slice(0, 10);
console.log(formatShadowStatus(shadowStatus(prs, today)));
