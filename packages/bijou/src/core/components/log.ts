import type { BijouContext } from '../../ports/context.js';
import { getDefaultContext } from '../../context.js';
import { badge } from './badge.js';

/** Severity levels for structured log messages. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/** Configuration options for the {@link log} component. */
export interface LogOptions {
  /** Whether to prepend a `HH:MM:SS` timestamp. Defaults to `false`. */
  readonly timestamp?: boolean;
  /** Whether to show the level prefix badge/label. Defaults to `true`. */
  readonly prefix?: boolean;
  /** Bijou context for rendering mode and theme resolution. */
  readonly ctx?: BijouContext;
}

/**
 * Resolve a BijouContext, falling back to the global default.
 *
 * Returns `undefined` if no context is provided and no default is configured,
 * allowing the component to degrade gracefully.
 *
 * @param ctx - Optional explicit context.
 * @returns The resolved context or `undefined`.
 */
function resolveCtx(ctx?: BijouContext): BijouContext | undefined {
  if (ctx) return ctx;
  try {
    return getDefaultContext();
  } catch {
    return undefined;
  }
}

/** Abbreviated 3-letter labels for each log level used in pipe/interactive modes. */
const LABELS: Record<LogLevel, string> = {
  debug: 'DBG',
  info: 'INF',
  warn: 'WRN',
  error: 'ERR',
  fatal: 'FTL',
};

/** Badge variant mapping for each log level used in interactive/static mode. */
const BADGE_VARIANTS: Record<LogLevel, string> = {
  debug: 'muted',
  info: 'info',
  warn: 'warning',
  error: 'error',
  fatal: 'error',
};

/** Uppercase labels for each log level used in accessible mode. */
const ACCESSIBLE_LABELS: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  fatal: 'FATAL',
};

/**
 * Format the current local wall-clock time as `HH:MM:SS`.
 *
 * @returns The formatted timestamp string.
 */
function formatTimestamp(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/**
 * Render a structured log message with level prefix and optional timestamp.
 *
 * Adapts output by mode:
 * - `pipe`/no context: `[HH:MM:SS] [LVL] message` brackets format.
 * - `accessible`: `HH:MM:SS LEVEL: message` screen-reader-friendly format.
 * - `interactive`/`static`: styled badge prefix with themed timestamp.
 *
 * Timestamp defaults to off; prefix defaults to on but can be disabled.
 *
 * @param level - Severity level of the log entry.
 * @param message - The log message body.
 * @param options - Rendering options including timestamp, prefix visibility, and context.
 * @returns The formatted log string.
 */
export function log(level: LogLevel, message: string, options?: LogOptions): string {
  const ctx = resolveCtx(options?.ctx);
  const showPrefix = options?.prefix !== false;  // default true
  const showTimestamp = options?.timestamp === true;  // default false

  const ts = showTimestamp ? formatTimestamp() : '';

  if (!ctx) {
    const parts: string[] = [];
    if (ts) parts.push(`[${ts}]`);
    if (showPrefix) parts.push(`[${LABELS[level]}]`);
    parts.push(message);
    return parts.join(' ');
  }

  const mode = ctx.mode;

  if (mode === 'pipe') {
    const parts: string[] = [];
    if (ts) parts.push(`[${ts}]`);
    if (showPrefix) parts.push(`[${LABELS[level]}]`);
    parts.push(message);
    return parts.join(' ');
  }

  if (mode === 'accessible') {
    const parts: string[] = [];
    if (ts) parts.push(ts);
    if (showPrefix) parts.push(`${ACCESSIBLE_LABELS[level]}:`);
    parts.push(message);
    return parts.join(' ');
  }

  // Interactive/static: use badge + styled message
  const parts: string[] = [];
  if (ts) {
    const tsStyled = ctx.style.styled(ctx.theme.theme.semantic.muted, ts);
    parts.push(tsStyled);
  }
  if (showPrefix) {
    const variant = BADGE_VARIANTS[level] as any;
    parts.push(badge(LABELS[level], { variant, ctx }));
  }
  parts.push(message);
  return parts.join(' ');
}
