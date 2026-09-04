import { describe, it, expect } from 'vitest';
import { computeNextDue } from '../dateUtils';

describe('computeNextDue', () => {
  it('returns empty for no effective date', () => {
    expect(computeNextDue('', 12)).toBe('');
  });

  it('computes expiry as effective + cycle - 1 day', () => {
    expect(computeNextDue('2026-08-15', 12)).toBe('2027-08-14');
    expect(computeNextDue('2026-08-15', 6)).toBe('2027-02-14');
  });

  it('handles month-end boundary dates without drift', () => {
    expect(computeNextDue('2026-03-31', 12)).toBe('2027-03-30');
    expect(computeNextDue('2026-12-31', 12)).toBe('2027-12-30');
    expect(computeNextDue('2026-05-31', 12)).toBe('2027-05-30');
  });

  it('defaults cycle to 12 months when not provided', () => {
    expect(computeNextDue('2026-08-15')).toBe('2027-08-14');
  });
});
