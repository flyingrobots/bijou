import { describe, expect, it } from 'vitest';
import { toDTCG } from './dtcg.js';
import { CYAN_MAGENTA } from './presets.js';

describe('DTCG export own-key handling', () => {
  it('does not serialize inherited theme token keys', () => {
    const status = { ...CYAN_MAGENTA.status };
    Object.setPrototypeOf(status, {
      inherited: { hex: '#ffffff' },
    });

    const doc = toDTCG({ ...CYAN_MAGENTA, status });
    expect(Object.prototype.hasOwnProperty.call(doc['status'], 'inherited')).toBe(false);
  });
});
