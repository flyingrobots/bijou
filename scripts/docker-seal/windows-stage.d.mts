import type { ExecutionOptions } from './process.mjs';
export function windowsStage<T>(label: string, operation: () => Promise<T>): Promise<T>;
export function windowsCommand(label: string, argv: readonly string[], options?: ExecutionOptions): Promise<{ code: number; output: Buffer }>;
