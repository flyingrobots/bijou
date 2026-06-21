import { describe, it, expect } from 'vitest';
import { isNoColor } from './resolve.js';
import { mockRuntime } from '../../adapters/test/runtime.js';

describe('isNoColor', () => {
  it('returns true when NO_COLOR is set', () => {
    const rt = mockRuntime({ env: { NO_COLOR: '' } });
    expect(isNoColor(rt)).toBe(true);
  });

  it('returns true when NO_COLOR is any value', () => {
    const rt = mockRuntime({ env: { NO_COLOR: '1' } });
    expect(isNoColor(rt)).toBe(true);
  });

  it('returns false when NO_COLOR is unset', () => {
    const rt = mockRuntime({});
    expect(isNoColor(rt)).toBe(false);
  });
});
