import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const run = (args: string[], input?: string) =>
  spawnSync('pnpm', ['-s', 'tsx', 'scripts/normalize-url.ts', ...args], { input, encoding: 'utf8' });

describe('normalize-url CLI', () => {
  it('stdin: skips blanks, prints ERROR line, exits 1', () => {
    const r = run(['-'], 'https://A.com/x/?utm_source=a\n\nbad\nhttps://b.com/y\n');
    expect(r.stdout.split('\n').filter(Boolean)).toEqual(['https://a.com/x', 'ERROR bad', 'https://b.com/y']);
    expect(r.status).toBe(1);
  });
  it('several args: in order, exit 0', () => {
    const r = run(['https://A.com/x/', 'https://b.com/y#z']);
    expect(r.stdout.split('\n').filter(Boolean)).toEqual(['https://a.com/x', 'https://b.com/y']);
    expect(r.status).toBe(0);
  });
});
