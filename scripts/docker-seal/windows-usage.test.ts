import { describe, expect, it } from 'vitest';
import { validateWindowsUsage } from './windows-usage.mjs';

const free = 60 * 1024 ** 3;
const baseline = { owners: { 'S-1-5-18': 100, 'S-1-5-93-2-2': 50 }, backingFree: free };

describe('Windows whole-volume accounting policy', () => {
  it('does not charge the image baseline as new data', () => {
    expect(validateWindowsUsage(baseline, baseline, 0, 10)).toBe(0);
  });
  it('does not let owner transfer cancel growth', () => {
    const moved = { owners: { 'S-1-5-18': 0, 'S-1-5-93-2-2': 150 }, backingFree: free };
    expect(() => validateWindowsUsage(moved, baseline, 0, 99)).toThrow('allowance exhausted');
  });
  it('charges an additional owner absent from the baseline', () => {
    const added = { owners: { ...baseline.owners, 'S-1-5-21-1': 11 }, backingFree: free };
    expect(() => validateWindowsUsage(added, baseline, 0, 10)).toThrow('allowance exhausted');
  });
  it('charges backing growth even when quota usage is unchanged', () => {
    expect(() => validateWindowsUsage(baseline, baseline, 11, 10)).toThrow('allowance exhausted');
  });
  it('refuses missing quota measurements', () => {
    expect(() => validateWindowsUsage({ owners: {}, backingFree: free }, baseline, 0, 10)).toThrow('unavailable');
  });
  it('refuses a partial owner inventory instead of treating the missing owner as deleted data', () => {
    expect(() => validateWindowsUsage({ owners: { 'S-1-5-18': 100 }, backingFree: free }, baseline, 0, 10)).toThrow('incomplete');
  });
  it('refuses a backing filesystem below the unchanged free-space floor', () => {
    expect(() => validateWindowsUsage({ ...baseline, backingFree: 49 * 1024 ** 3 }, baseline, 0, 10)).toThrow('free-space floor');
  });
});
