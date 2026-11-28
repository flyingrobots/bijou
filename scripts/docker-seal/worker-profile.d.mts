export interface WorkerProfile {
  readonly cpus: number;
  readonly memoryGiB: number;
  readonly memoryBytes: number;
  readonly vitestWorkers: number;
}
export const PROFILE_BOUNDS: Readonly<Record<'minCpus' | 'maxCpus' | 'reserveCpus' | 'minGiB' | 'maxGiB' | 'reserveGiB', number>>;
export function workerProfile(dockerCpus: number, dockerMemoryBytes: number): WorkerProfile;
export function parseDockerCapacity(text: string): { cpus: number; memoryBytes: number };
export function dockerWorkerProfile(
  execute: (argv: readonly string[]) => Promise<{ output: { toString(): string } }>,
): Promise<WorkerProfile>;
export function admissionWorkers(worker: string): readonly string[];
