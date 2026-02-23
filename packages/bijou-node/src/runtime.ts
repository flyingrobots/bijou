import type { RuntimePort } from '@flyingrobots/bijou';

export function nodeRuntime(): RuntimePort {
  return {
    env(key: string): string | undefined {
      return process.env[key];
    },
    get stdoutIsTTY(): boolean {
      return process.stdout.isTTY ?? false;
    },
    get stdinIsTTY(): boolean {
      return process.stdin.isTTY ?? false;
    },
    get columns(): number {
      return process.stdout.columns ?? 80;
    },
    get rows(): number {
      return process.stdout.rows ?? 24;
    },
  };
}
