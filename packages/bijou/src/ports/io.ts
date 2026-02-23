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
  setInterval(callback: () => void, ms: number): TimerHandle;
  readFile(path: string): string;
  readDir(path: string): string[];
  joinPath(...segments: string[]): string;
}
