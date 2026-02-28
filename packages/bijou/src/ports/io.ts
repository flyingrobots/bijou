export interface RawInputHandle {
  dispose(): void;
}

export interface TimerHandle {
  dispose(): void;
}

export interface IOPort {
  write(data: string): void;
  question(prompt: string): Promise<string>;
  rawInput(onKey: (key: string) => void): RawInputHandle;
  onResize(callback: (cols: number, rows: number) => void): RawInputHandle;
  setInterval(callback: () => void, ms: number): TimerHandle;
  readFile(path: string): string;
  /**
   * List directory contents. Directory names MUST include a trailing `/`
   * suffix (e.g. `"src/"`) so consumers can distinguish them from files.
   */
  readDir(path: string): string[];
  joinPath(...segments: string[]): string;
}
