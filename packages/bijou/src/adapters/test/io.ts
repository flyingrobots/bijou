import type { IOPort, RawInputHandle, TimerHandle } from '../../ports/io.js';
import { join } from 'path';

export interface MockIOOptions {
  answers?: string[];
  keys?: string[];
  files?: Record<string, string>;
  dirs?: Record<string, string[]>;
}

export interface MockIO extends IOPort {
  written: string[];
  answerQueue: string[];
  files: Record<string, string>;
  dirs: Record<string, string[]>;
}

export function mockIO(options: MockIOOptions = {}): MockIO {
  const written: string[] = [];
  const answerQueue = [...(options.answers ?? [])];
  const files = { ...(options.files ?? {}) };
  const dirs = { ...(options.dirs ?? {}) };

  return {
    written,
    answerQueue,
    files,
    dirs,

    write(data: string): void {
      written.push(data);
    },

    question(prompt: string): Promise<string> {
      written.push(prompt);
      return Promise.resolve(answerQueue.shift() ?? '');
    },

    rawInput(onKey: (key: string) => void): RawInputHandle {
      const keyQueue = [...(options.keys ?? [])];
      let disposed = false;
      function deliver() {
        if (disposed || keyQueue.length === 0) return;
        const key = keyQueue.shift()!;
        onKey(key);
        if (keyQueue.length > 0) queueMicrotask(deliver);
      }
      queueMicrotask(deliver);
      return { dispose() { disposed = true; } };
    },

    setInterval(callback: () => void, ms: number): TimerHandle {
      const id = globalThis.setInterval(callback, ms);
      return { dispose() { clearInterval(id); } };
    },

    readFile(path: string): string {
      const content = files[path];
      if (content === undefined) throw new Error(`Mock: file not found: ${path}`);
      return content;
    },

    readDir(path: string): string[] {
      return dirs[path] ?? [];
    },

    joinPath(...segments: string[]): string {
      return join(...segments);
    },
  };
}
