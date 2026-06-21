import type { KeyInputMsg, RawInputHandle, TimerHandle } from '../../ports/io.js';

import { resolveClock } from '../../core/clock.js';

import { decodeRawKeySequence } from '../../core/key-input.js';

import { join } from 'path';

import type { MockIO, MockIOOptions } from './io.part01.js';
export function mockIO(options: MockIOOptions = {}): MockIO {
  const written: string[] = [];
  const writtenErr: string[] = [];
  const answerQueue = [...(options.answers ?? [])];
  const files = { ...(options.files ?? {}) };
  const dirs = { ...(options.dirs ?? {}) };
  const clock = resolveClock(options.clock);

  return {
    written,
    writtenErr,
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
     * Append a string to the `writtenErr` buffer.
     * @param data - The string to write.
     */
    writeError(data: string): void {
      writtenErr.push(data);
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
      function deliver() {
        if (disposed || keyQueue.length === 0) return;
        const key = keyQueue.shift();
        if (key === undefined) return;
        onKey(key);
        if (keyQueue.length > 0) clock.queueMicrotask(deliver);
      }
      clock.queueMicrotask(deliver);
      return { dispose() { disposed = true; } };
    },

    /**
     * Deliver pre-loaded semantic keys to the callback via microtasks.
     *
     * Falls back to decoding `options.keys` so existing tests can keep
     * expressing scripted input in raw terminal strings while semantic-input
     * consumers still exercise the higher-level port.
     *
     * @param onKey - Callback invoked for each semantic keypress.
     * @returns A handle whose `dispose()` stops further key delivery.
     */
    keyInput(onKey: (key: KeyInputMsg) => void): RawInputHandle {
      const keyQueue = options.keyMsgs !== undefined
        ? [...options.keyMsgs]
        : (options.keys ?? []).flatMap((key) => decodeRawKeySequence(key));
      let disposed = false;
      function deliver() {
        if (disposed || keyQueue.length === 0) return;
        const key = keyQueue.shift();
        if (key === undefined) return;
        onKey(key);
        if (keyQueue.length > 0) clock.queueMicrotask(deliver);
      }
      clock.queueMicrotask(deliver);
      return { dispose() { disposed = true; } };
    },

    /** Register a resize callback (no-op in tests). */
    onResize(callback: (cols: number, rows: number) => void): RawInputHandle {
      return { dispose() { void callback; } };
    },

    /**
     * Start a real repeating timer via `globalThis.setInterval`.
     * @param callback - Function to call at each interval.
     * @param ms - Interval in milliseconds.
     * @returns A handle whose `dispose()` cancels the timer.
     */
    setInterval(callback: () => void, ms: number): TimerHandle {
      return clock.setInterval(callback, ms);
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
