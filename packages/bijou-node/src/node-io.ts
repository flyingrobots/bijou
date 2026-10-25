import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { resolveClock, type IOPort, type TimerHandle } from '@flyingrobots/bijou';
import type { NodeIOOptions } from './io-types.js';
import { createNodeInput } from './node-input.js';

/**
 * Create an {@link IOPort} backed by Node.js I/O primitives.
 *
 * Wires `process.stdout` for output, `process.stdin` / `readline` for input,
 * and `fs` / `path` for filesystem access. Returned handles from
 * `rawInput`, `onResize`, and `setInterval` clean up their underlying
 * resources when `dispose()` is called.
 *
 * @param options - Optional runtime overrides such as a deterministic clock for tests.
 * @returns An {@link IOPort} bound to the current Node.js process.
 */
export function nodeIO(options: NodeIOOptions = {}): IOPort {
  const clock = resolveClock(options.clock);
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  return {
    write(data: string): void {
      stdout.write(data);
    },

    /**
     * Write raw bytes directly to `process.stdout`. Allows the
     * renderer to bypass string encoding on the hot path. Respects
     * `len` so pooled buffers with extra capacity write only the
     * valid prefix. See WritePort.writeBytes docs for the contract.
     *
     * @param buf - The byte buffer (may be a pooled, reused buffer).
     * @param len - Number of valid bytes in `buf` to write.
     */
    writeBytes(buf: Uint8Array, len: number): void {
      if (len <= 0) return;
      if (len === buf.length) {
        stdout.write(buf);
      } else {
        stdout.write(buf.subarray(0, len));
      }
    },

    writeError(data: string): void {
      stderr.write(data);
    },

    ...createNodeInput(options, stdout),

    /**
     * Start a repeating interval timer via `globalThis.setInterval`.
     *
     * @param callback - Function invoked every `ms` milliseconds.
     * @param ms - Interval period in milliseconds.
     * @returns A {@link TimerHandle} that cancels the timer on disposal.
     */
    setInterval(callback: () => void, ms: number): TimerHandle {
      return clock.setInterval(callback, ms);
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
     * Uses `withFileTypes` to obtain directory entries directly from the
     * filesystem, avoiding a separate `statSync` per entry. Each entry is
     * either a plain filename or a directory name with a trailing slash
     * (e.g. `"src/"`), matching the {@link IOPort.readDir} contract.
     *
     * @param dirPath - Path to the directory to list.
     * @returns Entry names with trailing slashes on directories.
     * @throws {NodeJS.ErrnoException} If the directory does not exist or cannot be read.
     */
    readDir(dirPath: string): string[] {
      return readdirSync(dirPath, { withFileTypes: true }).map((entry) =>
        entry.isDirectory() ? entry.name + '/' : entry.name,
      );
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
