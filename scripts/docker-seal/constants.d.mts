export const WORKER: string;
export const OWNER: string;
export const MARKER: string;
export const BASE22: string;
export const MiB: number;
export const GiB: number;
export const LIMITS: Readonly<{
  source: number; pack: number; archive: number; stdin: number;
  log: number; retained: number; free: number; deadline: number;
}>;
export function imageName(version: string): string;
export function cleanEnvironment(): Record<string, string | undefined>;
