import { describe, it, expect } from 'vitest';
import { isoAtPublication } from '@/lib/dates';

describe('isoAtPublication', () => {
  it('anchors a day at midnight in Asia/Ho_Chi_Minh (+07:00)', () => {
    expect(isoAtPublication('2026-10-21')).toBe('2026-10-21T00:00:00+07:00');
  });
  it('throws on anything that is not YYYY-MM-DD', () => {
    expect(() => isoAtPublication('2026-1-5')).toThrow();
    expect(() => isoAtPublication('2026-10-21T00:00:00Z')).toThrow();
  });
});
