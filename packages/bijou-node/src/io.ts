import * as readline from 'readline';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import type { IOPort, RawInputHandle, TimerHandle } from '@flyingrobots/bijou';

export function nodeIO(): IOPort {
  return {
    write(data: string): void {
      process.stdout.write(data);
    },

    question(prompt: string): Promise<string> {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      return new Promise<string>((resolve) => {
        rl.question(prompt, (answer) => {
          rl.close();
          resolve(answer);
        });
      });
    },

    rawInput(onKey: (key: string) => void): RawInputHandle {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      const handler = (data: Buffer): void => {
        onKey(data.toString());
      };
      process.stdin.on('data', handler);
      return {
        dispose() {
          process.stdin.removeListener('data', handler);
          process.stdin.setRawMode(false);
          process.stdin.pause();
        },
      };
    },

    onResize(callback: (cols: number, rows: number) => void): RawInputHandle {
      const handler = (): void => {
        callback(process.stdout.columns ?? 80, process.stdout.rows ?? 24);
      };
      process.stdout.on('resize', handler);
      return {
        dispose() {
          process.stdout.removeListener('resize', handler);
        },
      };
    },

    setInterval(callback: () => void, ms: number): TimerHandle {
      const id = globalThis.setInterval(callback, ms);
      return {
        dispose() {
          clearInterval(id);
        },
      };
    },

    readFile(path: string): string {
      return readFileSync(path, 'utf8');
    },

    readDir(dirPath: string): string[] {
      return readdirSync(dirPath).map((name) => {
        try {
          return statSync(join(dirPath, name)).isDirectory() ? name + '/' : name;
        } catch {
          return name;
        }
      });
    },

    joinPath(...segments: string[]): string {
      return join(...segments);
    },
  };
}
