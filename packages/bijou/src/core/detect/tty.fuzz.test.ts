import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { detectOutputMode, type OutputMode } from './tty.js';
import { mockRuntime } from '../../adapters/test/runtime.js';

const VALID_MODES: OutputMode[] = ['interactive', 'pipe', 'static', 'accessible'];

const ENV_KEYS = ['NO_COLOR', 'CI', 'TERM', 'BIJOU_ACCESSIBLE', 'BIJOU_THEME'] as const;
const ENV_VALUES = [undefined, '', '0', '1', 'true', 'dumb', 'xterm-256color', 'garbage'] as const;

describe('detectOutputMode fuzz (property-based)', () => {
  it('always returns a valid OutputMode for random env + TTY combos', () => {
    const envArb = fc.record(
      Object.fromEntries(
        ENV_KEYS.map((key) => [
          key,
          fc.constantFrom(...ENV_VALUES),
        ]),
      ) as Record<typeof ENV_KEYS[number], fc.Arbitrary<typeof ENV_VALUES[number]>>,
    );

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
      ) as Record<string, fc.Arbitrary<typeof ENV_VALUES[number]>>,
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

  it('NO_COLOR always results in pipe or accessible mode', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', '1', 'true'),
        fc.boolean(),
        fc.constantFrom(undefined, 'true', '1'),
        (noColorVal, isTTY, ciVal) => {
          const env: Record<string, string> = { NO_COLOR: noColorVal };
          if (ciVal !== undefined) env['CI'] = ciVal;
          const rt = mockRuntime({ env, stdoutIsTTY: isTTY });
          const mode = detectOutputMode(rt);
          expect(['pipe', 'accessible']).toContain(mode);
        },
      ),
      { numRuns: 100 },
    );
  });
});
