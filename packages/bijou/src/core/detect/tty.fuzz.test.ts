import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { detectOutputMode, type OutputMode } from './tty.js';
import { mockRuntime } from '../../adapters/test/runtime.js';

const VALID_MODES: OutputMode[] = ['interactive', 'pipe', 'static', 'accessible'];

const ENV_KEYS = ['NO_COLOR', 'CI', 'TERM', 'BIJOU_ACCESSIBLE', 'BIJOU_THEME'] as const;
const ENV_VALUES = [undefined, '', '0', '1', 'true', 'dumb', 'xterm-256color', 'garbage'] as const;
const ENV_ARBITRARIES: Record<typeof ENV_KEYS[number], fc.Arbitrary<typeof ENV_VALUES[number]>> = {
  BIJOU_ACCESSIBLE: fc.constantFrom(...ENV_VALUES),
  BIJOU_THEME: fc.constantFrom(...ENV_VALUES),
  CI: fc.constantFrom(...ENV_VALUES),
  NO_COLOR: fc.constantFrom(...ENV_VALUES),
  TERM: fc.constantFrom(...ENV_VALUES),
};

describe('detectOutputMode fuzz (property-based)', () => {
  it('always returns a valid OutputMode for random env + TTY combos', () => {
    const envArb = fc.record(ENV_ARBITRARIES);

    fc.assert(
      fc.property(envArb, fc.boolean(), (envMap, isTTY) => {
        const env: Record<string, string> = {};
        for (const [k, v] of Object.entries(envMap)) {
          if (v !== undefined) env[k] = v;
        }
        const rt = mockRuntime({ env, stdoutIsTTY: isTTY });
        const mode = detectOutputMode(rt);
        expect(VALID_MODES).toContain(mode);
      }),
      { numRuns: 500 },
    );
  });

  it('BIJOU_ACCESSIBLE=1 always wins regardless of other env vars', () => {
    const envArb = fc.record(
      Object.fromEntries(
        ENV_KEYS.filter((k) => k !== 'BIJOU_ACCESSIBLE').map((key) => [
          key,
          fc.constantFrom(...ENV_VALUES),
        ]),
      ),
    );

    fc.assert(
      fc.property(envArb, fc.boolean(), (envMap, isTTY) => {
        const env: Record<string, string> = { BIJOU_ACCESSIBLE: '1' };
        for (const [k, v] of Object.entries(envMap)) {
          if (v !== undefined) env[k] = v;
        }
        const rt = mockRuntime({ env, stdoutIsTTY: isTTY });
        expect(detectOutputMode(rt)).toBe('accessible');
      }),
      { numRuns: 200 },
    );
  });

  // The strongest statement of the contract: NO_COLOR is not an input to mode at
  // all. Rather than assert which mode results, assert that adding NO_COLOR to
  // any environment changes nothing about the mode that environment produces.
  it('NO_COLOR never changes the detected mode', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', '1', 'true'),
        fc.boolean(),
        fc.constantFrom(undefined, 'true', '1'),
        fc.constantFrom(undefined, 'dumb', 'xterm-256color'),
        (noColorVal, isTTY, ciVal, termVal) => {
          const base: Record<string, string> = {};
          if (ciVal !== undefined) base['CI'] = ciVal;
          if (termVal !== undefined) base['TERM'] = termVal;
          const without = detectOutputMode(mockRuntime({ env: base, stdoutIsTTY: isTTY }));
          const withIt = detectOutputMode(
            mockRuntime({ env: { ...base, NO_COLOR: noColorVal }, stdoutIsTTY: isTTY }),
          );
          expect(withIt).toBe(without);
        },
      ),
      { numRuns: 200 },
    );
  });
});
