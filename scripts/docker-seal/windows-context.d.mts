import type { Stats } from 'node:fs';

export interface ContextMeasurement {
  entries: number;
  bytes: number;
}
export interface ContextFiles {
  readdirSync(path: string): string[];
  lstatSync(path: string, options: { throwIfNoEntry: false }): Stats | undefined;
}
export function measureContext(path: string, state?: ContextMeasurement, files?: ContextFiles, listed?: boolean): number;
