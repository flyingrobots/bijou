import * as readline from 'readline';
import type { IOPort, RawInputHandle } from '@flyingrobots/bijou';
import type { NodeIOOptions, NodeWriteStream } from './io-types.js';
import { createReadlineOutput } from './readline-output.js';

export function createNodeInput(options: NodeIOOptions, stdout: NodeWriteStream): Pick<IOPort, 'question' | 'rawInput' | 'onResize'> {
  return {
    /**
     * Prompt the user for a single line of input using a readline interface.
     *
     * Opens a new `readline.Interface` for each call and closes it once the
     * user presses Enter.
     *
     * @remarks The returned Promise will never settle if `process.stdin` is
     * already closed or ends before the user provides input.
     *
     * @param prompt - Text shown before the cursor.
     * @returns The user's response (excluding the trailing newline).
     */
    question(prompt: string): Promise<string> {
      const rl = readline.createInterface({
        input: process.stdin,
        output: options.stdout === undefined ? process.stdout : createReadlineOutput(stdout),
      });
      return new Promise<string>((resolve) => {
        rl.question(prompt, (answer) => {
          rl.close();
          resolve(answer);
        });
      });
    },

    /**
     * Enter raw-input mode on `process.stdin` and invoke a callback per keypress.
     *
     * Enables raw mode so individual key events are forwarded without waiting
     * for a newline. Call `dispose()` on the returned handle to restore normal
     * input mode and remove the listener.
     *
     * @param onKey - Callback invoked with the string representation of each stdin data chunk.
     * @returns A {@link RawInputHandle} that restores normal input mode on disposal.
     */
    rawInput(onKey: (key: string) => void): RawInputHandle {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      const handler = (data: Buffer): void => {
        onKey(data.toString());
      };
      process.stdin.on('data', handler);
      return {
        /** Remove the listener, disable raw mode, and pause stdin. */
        dispose() {
          process.stdin.removeListener('data', handler);
          process.stdin.setRawMode(false);
          process.stdin.pause();
        },
      };
    },

    /**
     * Register a callback invoked when the terminal is resized.
     *
     * Listens to the `'resize'` event on `process.stdout` and forwards the
     * current column and row counts. Falls back to 80x24 when properties are
     * unavailable.
     *
     * @param callback - Receives `(cols, rows)` on each resize event.
     * @returns A {@link RawInputHandle} that removes the listener on disposal.
     */
    onResize(callback: (cols: number, rows: number) => void): RawInputHandle {
      const handler = (): void => {
        callback(process.stdout.columns, process.stdout.rows);
      };
      process.stdout.on('resize', handler);
      return {
        /** Remove the resize listener from `process.stdout`. */
        dispose() {
          process.stdout.removeListener('resize', handler);
        },
      };
    },
  };
}
