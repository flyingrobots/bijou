import type { execute } from './process.mjs';
export function validateExportPath(path: unknown): string;
export function exportArtifacts(options: {
  readonly worker: string;
  readonly paths: readonly string[];
  readonly destination: string;
  readonly execute: typeof execute;
}): Promise<{ files: number; bytes: number }>;
