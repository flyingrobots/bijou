import { GiB } from './constants.mjs';

/**
 * The sealed worker takes the Docker VM's capacity less a reserve for the VM
 * itself, within fixed bounds. On a 4-CPU CI runner that is the 2 CPUs the
 * worker always had; on a 10-CPU workstation it is 8.
 */
export const PROFILE_BOUNDS = Object.freeze({
  minCpus: 2, maxCpus: 8, reserveCpus: 2,
  minGiB: 4, maxGiB: 8, reserveGiB: 2,
});

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

/** The worker's CPU, memory and Vitest pool for a Docker VM with this capacity. */
export function workerProfile(dockerCpus, dockerMemoryBytes) {
  if (!Number.isSafeInteger(dockerCpus) || dockerCpus < 1
      || !Number.isSafeInteger(dockerMemoryBytes) || dockerMemoryBytes < GiB) {
    throw new Error(`Docker capacity is unknown: ${String(dockerCpus)} CPUs, ${String(dockerMemoryBytes)} bytes`);
  }
  const b = PROFILE_BOUNDS;
  const cpus = clamp(dockerCpus - b.reserveCpus, b.minCpus, b.maxCpus);
  const memoryGiB = clamp(Math.floor(dockerMemoryBytes / GiB) - b.reserveGiB, b.minGiB, b.maxGiB);
  // One Vitest worker per CPU, but never more than one per GiB of memory.
  return Object.freeze({ cpus, memoryGiB, memoryBytes: memoryGiB * GiB, vitestWorkers: Math.min(cpus, memoryGiB) });
}

/** Parses `docker info --format '{{.NCPU}} {{.MemTotal}}'`. */
export function parseDockerCapacity(text) {
  const parts = String(text).trim().split(/\s+/);
  if (parts.length !== 2 || !parts.every((part) => /^\d+$/.test(part))) {
    throw new Error(`Unexpected docker info capacity: ${JSON.stringify(String(text).slice(0, 80))}`);
  }
  return { cpus: Number(parts[0]), memoryBytes: Number(parts[1]) };
}

/** The profile for the Docker VM this host talks to. */
export async function dockerWorkerProfile(execute) {
  const output = (await execute(['docker', 'info', '--format', '{{.NCPU}} {{.MemTotal}}'])).output.toString();
  const { cpus, memoryBytes } = parseDockerCapacity(output);
  return workerProfile(cpus, memoryBytes);
}

// The fixed-size workers of branches older than flyingrobots/bijou#953. Docker
// has room for one sealed run at a time, so a v2 run waits while one is active.
const LEGACY_WORKERS = Object.freeze(['bijou-sealed-tests-dependencies', 'bijou-sealed-tests']);

/** The workers a run must find free before it starts: its own, then the older branches'. */
export function admissionWorkers(worker) {
  return Object.freeze([`${worker}-dependencies`, worker, ...LEGACY_WORKERS]);
}
