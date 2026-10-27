export type PipelinePr = {
  number: number;
  headRefName: string;
  createdAt: string;
  mergedAt: string | null;
  labels: string[];
};

export type ShadowStatus = {
  consecutiveClean: number;
  days: number;
  firstPr: number | null;
  exitMet: boolean;
};

const NEED_CLEAN = 5;
const NEED_DAYS = 21;
const DAY_MS = 86_400_000;

export function shadowStatus(prs: PipelinePr[], today: string): ShadowStatus {
  const real = prs.filter((p) => !p.headRefName.startsWith('pipeline/dry-run-'));

  let first: PipelinePr | null = null;
  for (const p of real) {
    if (!first || Date.parse(p.createdAt) < Date.parse(first.createdAt)) first = p;
  }
  const days = first
    ? Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(first.createdAt)) / DAY_MS)
    : 0;

  const merged = real
    .filter((p) => p.mergedAt !== null && !p.headRefName.startsWith('pipeline/ledger-'))
    .sort((a, b) => Date.parse(b.mergedAt as string) - Date.parse(a.mergedAt as string));
  let consecutiveClean = 0;
  for (const p of merged) {
    if (!p.labels.includes('clean')) break;
    consecutiveClean++;
  }

  return {
    consecutiveClean,
    days,
    firstPr: first ? first.number : null,
    exitMet: consecutiveClean >= NEED_CLEAN && days >= NEED_DAYS,
  };
}

export function formatShadowStatus(s: ShadowStatus): string {
  const daysLine =
    s.firstPr === null
      ? 'Days since first pipeline PR: — (no pipeline PRs yet)'
      : `Days since first pipeline PR: ${s.days} (#${s.firstPr}) (need ${NEED_DAYS})`;
  return [
    `Consecutive clean merges: ${s.consecutiveClean} (need ${NEED_CLEAN})`,
    daysLine,
    `Exit condition: ${s.exitMet ? 'met' : 'not met'}`,
  ].join('\n');
}
