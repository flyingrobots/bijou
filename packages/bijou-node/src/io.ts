import * as readline from 'readline';
import { existsSync, readFileSync, readdirSync, realpathSync } from 'fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'path';
import { resolveClock, type ClockPort, type IOPort, type RawInputHandle, type TimerHandle } from '@flyingrobots/bijou';

/** Optional overrides for {@link nodeIO}. */
export interface NodeIOOptions {
  /** Clock override for deterministic timer scheduling in tests. */
  clock?: ClockPort;
}

export interface ScopedNodeIOOptions extends NodeIOOptions {
  /** Root directory that all file access must stay inside. */
  readonly root: string;
  /** Optional base adapter for stdout/stdin/timer behavior. Defaults to {@link nodeIO}. */
  readonly baseIO?: IOPort;
}

export interface ScopedNodeIO extends IOPort {
  /** Absolute root directory that constrains filesystem access. */
  readonly root: string;
  /** Resolve a relative or absolute path and reject anything outside {@link root}. */
  resolvePath(path: string): string;
}

export class ScopedNodeIOError extends Error {
  constructor(root: string, requestedPath: string) {
    super(`Scoped node IO path escapes root "${root}": ${requestedPath}`);
    this.name = 'ScopedNodeIOError';
  }
}

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
        process.stdout.write(buf);
      } else {
        process.stdout.write(buf.subarray(0, len));
      }
    },

    /**
     * Write a string directly to `process.stderr`.
     *
     * @param data - Text to write.
     */
    writeError(data: string): void {
      process.stderr.write(data);
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

/**
 * Create a Node.js I/O adapter whose filesystem access is constrained to a root directory.
 *
 * This wraps an {@link IOPort} and guards `readFile`, `readDir`, and `joinPath`
 * so app-level file access cannot escape the declared root. Hosts can also call
 * {@link ScopedNodeIO.resolvePath} before performing their own writes with Node's
 * filesystem APIs, preserving the same root boundary for output paths.
 *
 * @param options - Root path plus optional adapter overrides.
 * @returns An {@link ScopedNodeIO} rooted at the provided directory.
 */
export function scopedNodeIO(options: ScopedNodeIOOptions): ScopedNodeIO {
  const baseIO = options.baseIO ?? nodeIO({ clock: options.clock });
  const root = resolve(options.root);
  const realRoot = realpathSync.native(root);

  function assertWithinRoot(realCandidate: string, requestedPath: string): void {
    const rel = relative(realRoot, realCandidate);
    if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) {
      return;
    }
    throw new ScopedNodeIOError(root, requestedPath);
  }

  function resolvePathWithinRoot(requestedPath: string): string {
    const candidate = resolve(root, requestedPath);
    const suffix: string[] = [];
    let existingPath = candidate;

    while (!existsSync(existingPath)) {
      const parent = dirname(existingPath);
      if (parent === existingPath) {
        throw new ScopedNodeIOError(root, requestedPath);
      }
      suffix.unshift(basename(existingPath));
      existingPath = parent;
    }

    const realExistingPath = realpathSync.native(existingPath);
    const realCandidate = suffix.length === 0
      ? realExistingPath
      : resolve(realExistingPath, ...suffix);
    assertWithinRoot(realCandidate, requestedPath);
    return realCandidate;
  }

  return {
    ...baseIO,
    root,
    resolvePath(path: string): string {
      return resolvePathWithinRoot(path);
    },
    readFile(path: string): string {
      return baseIO.readFile(resolvePathWithinRoot(path));
    },
    readDir(path: string): string[] {
      return baseIO.readDir(resolvePathWithinRoot(path));
    },
    joinPath(...segments: string[]): string {
      return resolvePathWithinRoot(join(...segments));
    },
  };
}
