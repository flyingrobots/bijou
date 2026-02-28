import type { IOPort, RawInputHandle, TimerHandle } from '../../ports/io.js';
import { join } from 'path';

/**
 * Configuration for {@link mockIO}.
 */
export interface MockIOOptions {
  /** Pre-loaded answers returned by {@link MockIO.question} in FIFO order. */
  answers?: string[];
  /** Pre-loaded keypress strings delivered by {@link MockIO.rawInput} via microtasks. */
  keys?: string[];
  /** Virtual filesystem entries (path to content) for {@link MockIO.readFile}. */
  files?: Record<string, string>;
  /** Virtual directory listings (path to entries) for {@link MockIO.readDir}. */
  dirs?: Record<string, string[]>;
}

/**
 * Extended {@link IOPort} exposing internal buffers for test assertions.
 *
 * Use `written` to inspect everything sent to the output stream, and
 * `answerQueue` / `files` / `dirs` to prepopulate mock data.
 */
export interface MockIO extends IOPort {
  /** All strings passed to {@link write} and prompt strings passed to {@link question}. */
  written: string[];
  /** Remaining answers that will be consumed by {@link question}. */
  answerQueue: string[];
  /** Mutable virtual filesystem backing {@link readFile}. */
  files: Record<string, string>;
  /** Mutable virtual directory listing backing {@link readDir}. */
  dirs: Record<string, string[]>;
}

/**
 * Create an in-memory {@link IOPort} for tests.
 *
 * Capture all output in `written`, resolve `question()` calls from a
 * pre-loaded answer queue, deliver keypress events via microtasks, and
 * serve filesystem reads from an in-memory map.
 *
 * @param options - Optional pre-loaded answers, keys, files, and directory listings.
 * @returns A {@link MockIO} ready for use in tests.
 */
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

    /**
     * Append a string to the `written` buffer.
     * @param data - The string to write.
     */
    write(data: string): void {
      written.push(data);
    },

    /**
     * Record the prompt in `written` and resolve with the next queued answer.
     * @param prompt - The prompt string displayed to the user.
     * @returns The next answer from `answerQueue`, or `""` if exhausted.
     */
    question(prompt: string): Promise<string> {
      written.push(prompt);
      return Promise.resolve(answerQueue.shift() ?? '');
    },

    /**
     * Deliver pre-loaded keys to the callback via microtasks.
     *
     * Each key is delivered one at a time; delivery stops when the handle
     * is disposed or the key queue is exhausted.
     *
     * @param onKey - Callback invoked for each keypress.
     * @returns A handle whose `dispose()` stops further key delivery.
     */
    rawInput(onKey: (key: string) => void): RawInputHandle {
      const keyQueue = [...(options.keys ?? [])];
      let disposed = false;
      /** @internal Deliver the next key from the queue via microtask. */
      function deliver() {
        if (disposed || keyQueue.length === 0) return;
        const key = keyQueue.shift()!;
        onKey(key);
        if (keyQueue.length > 0) queueMicrotask(deliver);
      }
      queueMicrotask(deliver);
      return { dispose() { disposed = true; } };
    },

    /**
     * Register a resize callback (no-op in tests).
     * @param _callback - Ignored; resize events are not simulated.
     * @returns A no-op disposable handle.
     */
    onResize(_callback: (cols: number, rows: number) => void): RawInputHandle {
      return { dispose() {} };
    },

    /**
     * Start a real repeating timer via `globalThis.setInterval`.
     * @param callback - Function to call at each interval.
     * @param ms - Interval in milliseconds.
     * @returns A handle whose `dispose()` cancels the timer.
     */
    setInterval(callback: () => void, ms: number): TimerHandle {
      const id = globalThis.setInterval(callback, ms);
      return { dispose() { clearInterval(id); } };
    },

    /**
     * Read a file from the virtual filesystem.
     * @param path - The file path to look up.
     * @returns The file content as a string.
     * @throws {Error} If the path is not present in the virtual filesystem.
     */
    readFile(path: string): string {
      const content = files[path];
      if (content === undefined) throw new Error(`Mock: file not found: ${path}`);
      return content;
    },

    /**
     * List entries for a virtual directory.
     * @param path - The directory path to look up.
     * @returns The directory listing, or an empty array if not registered.
     */
    readDir(path: string): string[] {
      return dirs[path] ?? [];
    },

    /**
     * Join path segments using the platform separator (delegates to Node `path.join`).
     * @param segments - Path components to join.
     * @returns The joined path string.
     */
    joinPath(...segments: string[]): string {
      return join(...segments);
    },
  };
}
