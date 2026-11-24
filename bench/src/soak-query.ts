import { displayScenarios } from './soak-config.js';
import { resolveSoakOptions, type SoakOptions } from './soak-ports.js';

/** The options a browser address chooses, or the message that refuses them. */
export type SoakQuery =
  | { readonly ok: true; readonly options: SoakOptions }
  | { readonly ok: false; readonly message: string };

type Found = { readonly value: number | undefined } | { readonly message: string };

const MAX_FPS = 240;
const refusal = (name: string, rule: string, given: string): { readonly message: string } => ({ message: `BIJOU_SOAK_BAD_QUERY: ${name} must be ${rule}, got "${given}"` });

/** A number the rule accepts. A key that is absent is `undefined`; one that is repeated, empty or malformed is refused. */
function numberOf(params: URLSearchParams, name: string, rule: string, accepts: (n: number) => boolean): Found {
  const given = params.getAll(name);
  if (given.length === 0) return { value: undefined };
  const raw = given.join(',');
  const n = given.length === 1 && /^[0-9]+(?:\.[0-9]+)?$/u.test(raw) ? Number.parseFloat(raw) : Number.NaN;
  return accepts(n) ? { value: n } : refusal(name, rule, raw);
}

/**
 * Read `cycles`, `fps`, `dwell` and `scenario` from a query string. Any other
 * key (`app`, `backend`) is the page's and is left alone. A value that is
 * present and invalid is refused, never replaced by a default.
 */
export function parseSoakQuery(search: string): SoakQuery {
  const params = new URLSearchParams(search);
  const cycles = numberOf(params, 'cycles', 'a whole number of at least 1', (n) => Number.isInteger(n) && n >= 1);
  const fps = numberOf(params, 'fps', `a number above 0 and at most ${String(MAX_FPS)}`, (n) => n > 0 && n <= MAX_FPS);
  const dwell = numberOf(params, 'dwell', 'a number of seconds above 0', (n) => Number.isFinite(n) && n > 0);
  for (const found of [cycles, fps, dwell]) if ('message' in found) return { ok: false, message: found.message };
  const scenarios = params.getAll('scenario');
  const known = displayScenarios.map((s) => s.id);
  if (scenarios.length > 1 || (scenarios[0] !== undefined && !known.includes(scenarios[0]))) {
    return { ok: false, ...refusal('scenario', `one of ${known.join(', ')}`, scenarios.join(',')) };
  }
  const valueOf = (found: Found): number | undefined => ('value' in found ? found.value : undefined);
  return { ok: true, options: resolveSoakOptions({ cycles: valueOf(cycles), fps: valueOf(fps), dwell: valueOf(dwell), scenario: scenarios[0] }) };
}
