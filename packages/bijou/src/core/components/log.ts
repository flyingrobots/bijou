import type { BijouContext } from '../../ports/context.js';
import { getDefaultContext } from '../../context.js';
import { badge } from './badge.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogOptions {
  readonly timestamp?: boolean;     // default: false
  readonly prefix?: boolean;        // default: true
  readonly ctx?: BijouContext;
}

function resolveCtx(ctx?: BijouContext): BijouContext | undefined {
  if (ctx) return ctx;
  try {
    return getDefaultContext();
  } catch {
    return undefined;
  }
}

const LABELS: Record<LogLevel, string> = {
  debug: 'DBG',
  info: 'INF',
  warn: 'WRN',
  error: 'ERR',
  fatal: 'FTL',
};

const BADGE_VARIANTS: Record<LogLevel, string> = {
  debug: 'muted',
  info: 'info',
  warn: 'warning',
  error: 'error',
  fatal: 'error',
};

const ACCESSIBLE_LABELS: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  fatal: 'FATAL',
};

function formatTimestamp(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

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
