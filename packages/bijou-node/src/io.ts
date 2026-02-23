import * as readline from 'readline';
import { readFileSync, readdirSync } from 'fs';
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

    readDir(path: string): string[] {
      return readdirSync(path);
    },

    joinPath(...segments: string[]): string {
      return join(...segments);
    },
  };
}
