import { describe, expect, it } from 'vitest';
import { validateWindowsUsage } from './windows-usage.mjs';

const GiB = 1024 ** 3;
const free = 60 * GiB;
const baseline = { capacityBytes: 20 * GiB, usedBytes: 150, backingFree: free };

describe('Windows observed-usage budget', () => {
  it('does not charge the image baseline as new data', () => {
    expect(validateWindowsUsage(baseline, baseline, 0, 10)).toBe(0);
  });
  it('charges growth of used space on the worker volume', () => {
    expect(validateWindowsUsage({ ...baseline, usedBytes: 159 }, baseline, 0, 10)).toBe(9);
    expect(() => validateWindowsUsage({ ...baseline, usedBytes: 161 }, baseline, 0, 10)).toThrow('allowance exhausted');
  });
  it('charges backing growth even when the worker volume is unchanged', () => {
    expect(() => validateWindowsUsage(baseline, baseline, 11, 10)).toThrow('allowance exhausted');
  });
  it('does not let a smaller worker volume cancel backing growth', () => {
    expect(validateWindowsUsage({ ...baseline, usedBytes: 0 }, baseline, 7, 10)).toBe(7);
  });
  it.each([['absent', undefined], ['negative', -1], ['fractional', 1.5], ['not a number', Number.NaN]])(
    'refuses a used-space measurement that is %s instead of counting it as zero',
    (_name, usedBytes) => {
      expect(() => validateWindowsUsage({ ...baseline, usedBytes }, baseline, 0, 10)).toThrow('Missing or invalid Windows worker used space measurement');
    },
  );
  it('refuses a baseline with no used-space measurement', () => {
    expect(() => validateWindowsUsage(baseline, { ...baseline, usedBytes: undefined }, 0, 10)).toThrow('Missing or invalid Windows baseline used space measurement');
  });
  it('refuses a worker volume whose capacity changed after the baseline', () => {
    expect(() => validateWindowsUsage({ ...baseline, capacityBytes: 21 * GiB }, baseline, 0, 10)).toThrow('Windows worker storage capacity changed');
  });
  it('refuses a backing filesystem below the unchanged free-space floor', () => {
    expect(() => validateWindowsUsage({ ...baseline, backingFree: 49 * GiB }, baseline, 0, 10)).toThrow('free-space floor');
  });
});
