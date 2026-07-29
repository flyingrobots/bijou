import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as os from 'node:os';
import type { ChildSample, Fingerprint } from './runner-types.js';

const childPath = resolve(dirname(fileURLToPath(import.meta.url)), 'child.ts');

export function detectFingerprint(): Fingerprint {
  const cpus = os.cpus();
  return {
    platform: process.platform,
    arch: process.arch,
    release: os.release(),
    nodeVersion: process.version,
    cpuModel: cpus[0]?.model ?? 'unknown',
    cpuCount: cpus.length,
    totalMemoryBytes: os.totalmem(),
    hostname: os.hostname(),
  };
}

export function detectCommit(): string | null {
  const result = spawnSync('git', ['rev-parse', '--short', 'HEAD'], {
    encoding: 'utf8',
  });
  if (result.status !== 0) return null;
  return result.stdout.trim() || null;
}

export function runChild(
  id: string,
  sample: number,
  warmup: number,
  frames: number,
): ChildSample {
  const result = spawnSync(
    process.execPath,
    [
      '--import',
      'tsx',
      childPath,
      `--scenario=${id}`,
      `--sample=${String(sample)}`,
      `--warmup=${String(warmup)}`,
      `--frames=${String(frames)}`,
    ],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  if (result.status !== 0) {
    throw new Error(`fail ${id}#${String(sample)}: ${result.stderr}`);
  }
  const line = result.stdout.trim();
  if (!line) throw new Error(`no output ${id}#${String(sample)}`);
  try {
    return parseSample(JSON.parse(line));
  } catch (error) {
    throw new Error(
      `bad ${id}#${String(sample)}: ${error instanceof Error ? error.message : String(error)}\nraw: ${line}`,
      { cause: error },
    );
  }
}

function parseSample(value: unknown): ChildSample {
  if (!isSample(value)) throw new Error('bad sample');
  return value;
}

function isSample(value: unknown): value is ChildSample {
  return (
    typeof value === 'object' &&
    value !== null &&
    'scenarioId' in value &&
    typeof value.scenarioId === 'string' &&
    'sampleIndex' in value &&
    typeof value.sampleIndex === 'number' &&
    'elapsedNs' in value &&
    typeof value.elapsedNs === 'number' &&
    'frames' in value &&
    typeof value.frames === 'number' &&
    'nsPerFrame' in value &&
    typeof value.nsPerFrame === 'number'
  );
}
