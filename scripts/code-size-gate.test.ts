import { describe, expect, it } from 'vitest';
import {
  evaluateCodeSizeGate,
  formatCodeSizeGateResult,
} from './code-size-gate.js';

describe('code size gate', () => {
  it('rejects files above the hard 1,000 line ceiling', () => {
    const result = evaluateCodeSizeGate({
      files: [{ path: 'src/giant.ts', lines: 1_001 }],
      baseline: [],
    });

    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      'src/giant.ts has 1001 lines; hard limit 1000',
    ]);
  });

  it('allows legacy hard-limit files that hold or shrink against a baseline', () => {
    const result = evaluateCodeSizeGate({
      files: [{ path: 'src/legacy-giant.ts', lines: 1_001 }],
      baseline: [{ path: 'src/legacy-giant.ts', lines: 1_100 }],
    });

    expect(result.ok).toBe(true);
    expect(formatCodeSizeGateResult(result)).toBe('code-size-gate: ok (1 files over 500 lines; 1 legacy hard-limit files over 1000)\n');
  });

  it('rejects legacy hard-limit files that grow beyond their baseline', () => {
    const result = evaluateCodeSizeGate({
      files: [{ path: 'src/legacy-giant.ts', lines: 1_101 }],
      baseline: [{ path: 'src/legacy-giant.ts', lines: 1_100 }],
    });

    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      'src/legacy-giant.ts has 1101 lines; legacy 1100',
    ]);
  });

  it('rejects new files over the 500 line ratchet boundary', () => {
    const result = evaluateCodeSizeGate({
      files: [{ path: 'src/new-large.ts', lines: 501 }],
      baseline: [],
    });

    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      'src/new-large.ts has 501 lines; over 500 needs ratchet',
    ]);
  });

  it('rejects ratcheted files that grow beyond their baseline', () => {
    const result = evaluateCodeSizeGate({
      files: [{ path: 'src/legacy-large.ts', lines: 650 }],
      baseline: [{ path: 'src/legacy-large.ts', lines: 600 }],
    });

    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      'src/legacy-large.ts has 650 lines; ratchet 600',
    ]);
  });

  it('allows ratcheted files that hold or shrink and unratcheted small files', () => {
    const result = evaluateCodeSizeGate({
      files: [
        { path: 'src/legacy-large.ts', lines: 600 },
        { path: 'src/small.ts', lines: 500 },
      ],
      baseline: [{ path: 'src/legacy-large.ts', lines: 650 }],
    });

    expect(result.ok).toBe(true);
    expect(formatCodeSizeGateResult(result)).toBe('code-size-gate: ok (1 files over 500 lines; 0 legacy hard-limit files over 1000)\n');
  });
});
