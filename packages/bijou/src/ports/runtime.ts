export interface RuntimePort {
  env(key: string): string | undefined;
  stdoutIsTTY: boolean;
  stdinIsTTY: boolean;
  columns: number;
  rows: number;
}
