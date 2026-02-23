import type { RuntimePort } from '../../ports/runtime.js';

export interface MockRuntimeOptions {
  env?: Record<string, string>;
  stdoutIsTTY?: boolean;
  stdinIsTTY?: boolean;
  columns?: number;
  rows?: number;
}

export function mockRuntime(options: MockRuntimeOptions = {}): RuntimePort {
  const envMap = options.env ?? {};
  return {
    env(key: string): string | undefined {
      return envMap[key];
    },
    stdoutIsTTY: options.stdoutIsTTY ?? true,
    stdinIsTTY: options.stdinIsTTY ?? true,
    columns: options.columns ?? 80,
    rows: options.rows ?? 24,
  };
}
