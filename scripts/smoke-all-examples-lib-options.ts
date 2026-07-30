import type {
  ScenarioMode,
  SmokeRunOptions,
} from './smoke-all-examples-lib-contract.js';

export function parseSmokeRunOptions(
  argv: readonly string[],
): SmokeRunOptions {
  const options: {
    skipBuild?: boolean;
    fast?: boolean;
    pipeConcurrency?: number;
    modes?: ScenarioMode[];
  } = {};
  for (const arg of argv) {
    if (arg === '--skip-build') {
      options.skipBuild = true;
    } else if (arg === '--fast') {
      options.fast = true;
    } else if (arg.startsWith('--pipe-concurrency=')) {
      const raw = arg.slice('--pipe-concurrency='.length);
      const parsed = Number.parseInt(raw, 10);
      if (!Number.isFinite(parsed) || String(parsed) !== raw) {
        throw new Error(`invalid --pipe-concurrency value: ${raw}`);
      }
      options.pipeConcurrency = parsed;
    } else if (arg.startsWith('--mode=')) {
      const raw = arg.slice('--mode='.length);
      if (!isMode(raw)) throw new Error(`invalid --mode value: ${raw}`);
      options.modes ??= [];
      options.modes.push(raw);
    } else {
      throw new Error(`unknown smoke:examples option: ${arg}`);
    }
  }
  return options;
}

function isMode(value: string): value is ScenarioMode {
  return value === 'pipe'
    || value === 'static-tty'
    || value === 'interactive-scripted';
}
