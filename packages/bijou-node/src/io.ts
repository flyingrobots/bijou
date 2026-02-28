import * as readline from 'readline';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import type { IOPort, RawInputHandle, TimerHandle } from '@flyingrobots/bijou';

/**
 * Create an {@link IOPort} backed by Node.js I/O primitives.
 *
 * Wires `process.stdout` for output, `process.stdin` / `readline` for input,
 * and `fs` / `path` for filesystem access. Returned handles from
 * `rawInput`, `onResize`, and `setInterval` clean up their underlying
 * resources when `dispose()` is called.
 *
 * @returns An {@link IOPort} bound to the current Node.js process.
 */
export function nodeIO(): IOPort {
  return {
    /**
     * Write a string directly to `process.stdout`.
     *
     * @param data - Text to write.
     */
    write(data: string): void {
      process.stdout.write(data);
    },

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
        output: process.stdout,
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
        callback(process.stdout.columns ?? 80, process.stdout.rows ?? 24);
      };
      process.stdout.on('resize', handler);
      return {
        /** Remove the resize listener from `process.stdout`. */
        dispose() {
          process.stdout.removeListener('resize', handler);
        },
      };
    },

    /**
     * Start a repeating interval timer via `globalThis.setInterval`.
     *
     * @param callback - Function invoked every `ms` milliseconds.
     * @param ms - Interval period in milliseconds.
     * @returns A {@link TimerHandle} that cancels the timer on disposal.
     */
    setInterval(callback: () => void, ms: number): TimerHandle {
      const id = globalThis.setInterval(callback, ms);
      return {
        /** Cancel the repeating timer. */
        dispose() {
          clearInterval(id);
        },
      };
    },

    /**
     * Read an entire file synchronously as a UTF-8 string.
     *
     * @param path - Absolute or relative file path.
     * @returns The file contents as a string.
     * @throws {NodeJS.ErrnoException} If the file does not exist or cannot be read.
     */
    readFile(path: string): string {
      return readFileSync(path, 'utf8');
    },

    /**
     * List directory contents, appending `'/'` to directory names.
     *
     * Each entry is either a plain filename or a directory name with a
     * trailing slash (e.g. `"src/"`), matching the {@link IOPort.readDir}
     * contract. If `statSync` fails for an entry (e.g. broken symlink), the bare name is returned without a trailing slash.
     *
     * @param dirPath - Path to the directory to list.
     * @returns Entry names with trailing slashes on directories.
     * @throws {NodeJS.ErrnoException} If the directory does not exist or cannot be read.
     */
    readDir(dirPath: string): string[] {
      return readdirSync(dirPath).map((name) => {
        try {
          return statSync(join(dirPath, name)).isDirectory() ? name + '/' : name;
        } catch {
          return name;
        }
      });
    },

    /**
     * Join path segments using Node.js `path.join`.
     *
     * @param segments - One or more path segments.
     * @returns The joined path string.
     */
    joinPath(...segments: string[]): string {
      return join(...segments);
    },
  };
}
