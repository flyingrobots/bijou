import type { RawInputHandle, RuntimePort } from '@flyingrobots/bijou';

/** Options for {@link createWebRuntime}. */
export interface WebRuntimeOptions {
  /** Initial environment variables, such as `NO_COLOR` or `TERM`. Copied, never aliased. */
  readonly env?: Readonly<Record<string, string>>;
  /** Width of the output surface in columns. Defaults to 80. */
  readonly columns?: number;
  /** Height of the output surface in rows. Defaults to 24. */
  readonly rows?: number;
  /** Expected refresh rate in frames per second. Defaults to 60. */
  readonly refreshRate?: number;
  /** Whether output goes to an interactive surface. Defaults to `true`. */
  readonly stdoutIsTTY?: boolean;
  /** Whether an interactive input stream is attached. Defaults to `false`. */
  readonly stdinIsTTY?: boolean;
}

/** A {@link RuntimePort} for browser hosts, with a mutable size and environment. */
export interface WebRuntime extends RuntimePort {
  /** Set an environment variable, or remove it with `undefined`. */
  setEnv(key: string, value: string | undefined): void;
  /** Set both dimensions at once and notify resize listeners one time. */
  resize(columns: number, rows: number): void;
  /**
   * Register a callback that runs when the size changes.
   * @returns A handle whose `dispose()` removes the listener.
   */
  onResize(callback: (columns: number, rows: number) => void): RawInputHandle;
}

const DEFAULT_COLUMNS = 80;
const DEFAULT_ROWS = 24;
const DEFAULT_REFRESH_RATE = 60;

/** Whole cells, at least one. A value that is not finite uses the fallback. */
function clampDimension(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}

/** A positive finite rate, or the default. */
function sanitizeRefreshRate(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : DEFAULT_REFRESH_RATE;
}

/**
 * Create an in-memory {@link RuntimePort} for a browser host.
 *
 * A browser has no environment variables and no terminal, so the caller owns
 * both. Zero and negative dimensions clamp to one cell.
 *
 * @param options - Initial environment, size, refresh rate, and TTY flags.
 * @returns A runtime whose size and environment can change after creation.
 */
export function createWebRuntime(options: WebRuntimeOptions = {}): WebRuntime {
  const env = new Map(Object.entries(options.env ?? {}));
  const listeners = new Set<(columns: number, rows: number) => void>();
  let columns = clampDimension(options.columns, DEFAULT_COLUMNS);
  let rows = clampDimension(options.rows, DEFAULT_ROWS);
  let refreshRate = sanitizeRefreshRate(options.refreshRate);

  const setSize = (nextColumns: number, nextRows: number): void => {
    const clampedColumns = clampDimension(nextColumns, DEFAULT_COLUMNS);
    const clampedRows = clampDimension(nextRows, DEFAULT_ROWS);
    if (clampedColumns === columns && clampedRows === rows) return;
    columns = clampedColumns;
    rows = clampedRows;
    for (const listener of [...listeners]) listener(columns, rows);
  };

  return {
    env: (key) => env.get(key),
    setEnv(key, value) {
      if (value === undefined) env.delete(key);
      else env.set(key, value);
    },
    stdoutIsTTY: options.stdoutIsTTY ?? true,
    stdinIsTTY: options.stdinIsTTY ?? false,
    get columns(): number { return columns; },
    set columns(value: number) { setSize(value, rows); },
    get rows(): number { return rows; },
    set rows(value: number) { setSize(columns, value); },
    get refreshRate(): number { return refreshRate; },
    set refreshRate(value: number) { refreshRate = sanitizeRefreshRate(value); },
    resize: setSize,
    onResize(callback) {
      listeners.add(callback);
      return { dispose: () => { listeners.delete(callback); } };
    },
  };
}
