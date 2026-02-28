/** Disposable handle returned by raw-input or resize listeners. */
export interface RawInputHandle {
  /** Remove the listener and release resources. */
  dispose(): void;
}

/** Disposable handle returned by interval timers. */
export interface TimerHandle {
  /** Cancel the timer. */
  dispose(): void;
}

/**
 * Abstract I/O port for terminal interaction and filesystem access.
 *
 * Decouples bijou components from Node.js readline, process.stdout, and `fs`
 * so they can run in any environment that implements this interface.
 */
export interface IOPort {
  /** Write a string to the output stream (typically stdout). */
  write(data: string): void;

  /** Prompt the user for a single line of text input. */
  question(prompt: string): Promise<string>;

  /**
   * Enter raw-input mode, invoking {@link onKey} for each keypress.
   * @returns A handle whose `dispose()` restores normal input mode.
   */
  rawInput(onKey: (key: string) => void): RawInputHandle;

  /**
   * Register a callback invoked when the terminal is resized.
   * @returns A handle whose `dispose()` removes the listener.
   */
  onResize(callback: (cols: number, rows: number) => void): RawInputHandle;

  /**
   * Start a repeating timer.
   * @returns A handle whose `dispose()` cancels the timer.
   */
  setInterval(callback: () => void, ms: number): TimerHandle;

  /** Read an entire file as a UTF-8 string. */
  readFile(path: string): string;

  /**
   * List directory contents. Directory names MUST include a trailing `/`
   * suffix (e.g. `"src/"`) so consumers can distinguish them from files.
   */
  readDir(path: string): string[];

  /** Join path segments using the platform separator. */
  joinPath(...segments: string[]): string;
}
