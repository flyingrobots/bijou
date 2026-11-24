import type { Stats } from 'node:fs';

export interface GeneratedFiles {
  readdirSync(path: string): string[];
  lstatSync(path: string): Stats;
}
export function generatedBytes(roots: readonly string[], baseline: Map<string, number>, record?: boolean, files?: GeneratedFiles): number;
