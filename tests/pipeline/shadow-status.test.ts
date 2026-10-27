import { describe, expect, it } from 'vitest';
import { formatShadowStatus, shadowStatus, type PipelinePr } from '../../lib/pipeline/shadow-status';

let n = 0;
const pr = (o: Partial<PipelinePr> = {}): PipelinePr => ({
  number: ++n,
  headRefName: `pipeline/2026-10-${String(n).padStart(2, '0')}`,
  createdAt: '2026-10-05T00:00:00Z',
  mergedAt: '2026-10-06T00:00:00Z',
  labels: ['pipeline', 'clean'],
  ...o,
});
const five = (): PipelinePr[] => [
  pr({ createdAt: '2026-10-01T00:00:00Z', mergedAt: '2026-10-02T00:00:00Z' }),
  pr({ mergedAt: '2026-10-03T00:00:00Z' }),
  pr({ mergedAt: '2026-10-04T00:00:00Z' }),
  pr({ mergedAt: '2026-10-05T00:00:00Z' }),
  pr({ mergedAt: '2026-10-06T00:00:00Z' }),
];

describe('shadowStatus', () => {
  it('empty list', () => {
    expect(shadowStatus([], '2026-10-22')).toEqual({
      consecutiveClean: 0,
      days: 0,
      firstPr: null,
      exitMet: false,
    });
  });
  it('met at 21 days', () => {
    const s = shadowStatus(five(), '2026-10-22');
    expect(s.consecutiveClean).toBe(5);
    expect(s.days).toBe(21);
    expect(s.exitMet).toBe(true);
  });
  it('not met at 20 days', () => {
    const s = shadowStatus(five(), '2026-10-21');
    expect(s.days).toBe(20);
    expect(s.exitMet).toBe(false);
  });
  it('streak stops at first non-clean (newest first)', () => {
    const prs = [
      pr({ mergedAt: '2026-10-10T00:00:00Z' }),
      pr({ mergedAt: '2026-10-09T00:00:00Z' }),
      pr({ mergedAt: '2026-10-08T00:00:00Z', labels: ['pipeline'] }),
      pr({ mergedAt: '2026-10-07T00:00:00Z' }),
      pr({ mergedAt: '2026-10-06T00:00:00Z' }),
      pr({ mergedAt: '2026-10-05T00:00:00Z' }),
      pr({ mergedAt: '2026-10-04T00:00:00Z' }),
      pr({ mergedAt: '2026-10-03T00:00:00Z' }),
    ];
    expect(shadowStatus(prs, '2026-10-22').consecutiveClean).toBe(2);
  });
  it('ignores dry-run PRs entirely', () => {
    const prs = [
      pr({ headRefName: 'pipeline/dry-run-2026-09-01', createdAt: '2026-09-01T00:00:00Z', labels: ['pipeline'] }),
      ...five(),
    ];
    const s = shadowStatus(prs, '2026-10-22');
    expect(s.firstPr).toBe(prs[1].number);
    expect(s.days).toBe(21);
  });
  it('merged ledger PR does not reset the streak', () => {
    const prs = [
      pr({ mergedAt: '2026-10-04T00:00:00Z' }),
      pr({ headRefName: 'pipeline/ledger-x', mergedAt: '2026-10-05T00:00:00Z', labels: ['pipeline'] }),
      pr({ mergedAt: '2026-10-06T00:00:00Z' }),
    ];
    expect(shadowStatus(prs, '2026-10-22').consecutiveClean).toBe(2);
  });
  it('ledger PR starts the clock', () => {
    const prs = [pr({ headRefName: 'pipeline/ledger-x', createdAt: '2026-10-01T00:00:00Z', labels: ['pipeline'] })];
    const s = shadowStatus(prs, '2026-10-11');
    expect(s.firstPr).toBe(prs[0].number);
    expect(s.days).toBe(10);
  });
  it('closed-unmerged PR does not reset', () => {
    const prs = [
      pr({ mergedAt: '2026-10-04T00:00:00Z' }),
      pr({ mergedAt: null, labels: ['pipeline'] }),
      pr({ mergedAt: '2026-10-06T00:00:00Z' }),
    ];
    expect(shadowStatus(prs, '2026-10-22').consecutiveClean).toBe(2);
  });
});

describe('formatShadowStatus', () => {
  it('met', () => {
    const s = shadowStatus(five(), '2026-10-22');
    expect(formatShadowStatus(s).split('\n')).toEqual([
      'Consecutive clean merges: 5 (need 5)',
      `Days since first pipeline PR: 21 (#${s.firstPr}) (need 21)`,
      'Exit condition: met',
    ]);
  });
  it('no PRs', () => {
    expect(formatShadowStatus(shadowStatus([], '2026-10-22')).split('\n')).toEqual([
      'Consecutive clean merges: 0 (need 5)',
      'Days since first pipeline PR: — (no pipeline PRs yet)',
      'Exit condition: not met',
    ]);
  });
});
