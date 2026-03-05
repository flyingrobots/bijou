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
 * Minimal output-only port.
 *
 * Sufficient for components that only need to write to stdout
 * (e.g. animated spinners, progress bars).
 */
export interface WritePort {
  /** Write a string to the output stream (typically stdout). */
  write(data: string): void;
  /** Write a string to the error stream (typically stderr). */
  writeError(data: string): void;
}

/**
 * Output + line-oriented input port.
 *
 * Extends {@link WritePort} with `question()` for form fallback modes
 * that collect input via readline.
 */
export interface QueryPort extends WritePort {
  /** Prompt the user for a single line of text input. */
  question(prompt: string): Promise<string>;
}

/**
 * Full interactive terminal port.
 *
 * Extends {@link QueryPort} with raw keyboard input and timers
 * for interactive form components and animated output.
 */
export interface InteractivePort extends QueryPort {
  /**
   * Enter raw-input mode, invoking {@link onKey} for each keypress.
   * @returns A handle whose `dispose()` restores normal input mode.
   */
  rawInput(onKey: (key: string) => void): RawInputHandle;

  /**
   * Start a repeating timer.
   * @returns A handle whose `dispose()` cancels the timer.
   */
  setInterval(callback: () => void, ms: number): TimerHandle;
}

/**
 * Filesystem access port for asset and theme loading.
 *
 * Used at initialization time by logo loaders and DTCG theme importers,
 * not during interactive component rendering.
 */
export interface FilePort {
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

/**
 * Abstract I/O port for terminal interaction and filesystem access.
 *
 * This is the full union of all I/O sub-ports plus `onResize()`.
 * Most consumers should depend on the narrowest sub-port they need:
 * {@link WritePort}, {@link QueryPort}, {@link InteractivePort}, or {@link FilePort}.
 *
 * @see {@link WritePort} — output only
 * @see {@link QueryPort} — output + line input
 * @see {@link InteractivePort} — output + line input + raw keys + timers
 * @see {@link FilePort} — filesystem access
 */
export interface IOPort extends InteractivePort, FilePort {
  /**
   * Register a callback invoked when the terminal is resized.
   * @returns A handle whose `dispose()` removes the listener.
   */
  onResize(callback: (cols: number, rows: number) => void): RawInputHandle;
}
