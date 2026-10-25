import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SCENARIOS } from './scenarios/index.js';
import type { AnyScenario } from './scenarios/types.js';


const argv = process.argv.slice(2);
function argValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = argv.find((a) => a.startsWith(prefix));
  return match?.slice(prefix.length);
}
function argNum(name: string, fallback: number): number {
  const raw = argValue(name);
  if (raw === undefined) return fallback;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}
function argStr(name: string, fallback: string): string {
  return argValue(name) ?? fallback;
}

export const MAX_CYCLES = argNum('cycles', Infinity);
export const TARGET_FPS = argNum('fps', 30);
export const DWELL_SECS = argNum('dwell', 4);
export const LOG_PATH = resolve(argStr('out', 'bench/soak.jsonl'));

export const displayScenarios = SCENARIOS.filter(
  (s): s is AnyScenario & { getDisplaySurface: NonNullable<AnyScenario['getDisplaySurface']> } =>
    s.getDisplaySurface !== undefined,
);

if (displayScenarios.length === 0) {
  throw new Error('No display scenarios found — at least one scenario must define getDisplaySurface');
}

if (!existsSync(LOG_PATH)) writeFileSync(LOG_PATH, '');

export const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
