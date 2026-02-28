import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import type { BaseStatusKey } from '../theme/tokens.js';
import { getDefaultContext } from '../../context.js';

/** Represent a single event on a vertical timeline. */
export interface TimelineEvent {
  /** Primary label for the event. */
  label: string;
  /** Optional longer description shown after the label. */
  description?: string;
  /** Status key determining the dot style and color. Defaults to `'muted'`. */
  status?: BaseStatusKey;
}

/** Configuration options for the {@link timeline} component. */
export interface TimelineOptions {
  /** Token used to style the vertical connector line between events. */
  lineToken?: TokenValue;
  /** Bijou context for rendering mode and theme resolution. */
  ctx?: BijouContext;
}

/**
 * Resolve the provided context or fall back to the global default.
 *
 * @param ctx - Optional context override.
 * @returns The resolved {@link BijouContext}.
 */
function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

/** Set of status keys that render as filled dots (`●`) rather than hollow (`○`). */
const FILLED_STATUSES: Set<string> = new Set(['success', 'error', 'warning', 'info', 'active']);

/**
 * Capitalize a status key for accessible/human-readable output.
 *
 * @param status - The status key to capitalize.
 * @returns The status string with the first letter uppercased.
 */
function statusLabel(status: BaseStatusKey): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Render a vertical timeline of events with status-colored dots.
 *
 * Adapts output by mode:
 * - `pipe`: `[STATUS] label - description` lines.
 * - `accessible`: `Status: label. description` lines.
 * - `interactive`/`static`: colored `●`/`○` dots connected by `│` lines.
 *
 * @param events - Array of timeline events to render.
 * @param options - Rendering options including line token and context.
 * @returns The formatted timeline string.
 */
export function timeline(events: TimelineEvent[], options: TimelineOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;

  if (mode === 'pipe') {
    return events
      .map((e) => {
        const status = (e.status ?? 'muted').toUpperCase();
        const desc = e.description ? ` - ${e.description}` : '';
        return `[${status}] ${e.label}${desc}`;
      })
      .join('\n');
  }

  if (mode === 'accessible') {
    return events
      .map((e) => {
        const label = statusLabel(e.status ?? 'muted');
        const desc = e.description ? `. ${e.description}` : '';
        return `${label}: ${e.label}${desc}`;
      })
      .join('\n');
  }

  const lineToken = options.lineToken ?? ctx.theme.theme.border.muted;

  const lines: string[] = [];
  for (const [i, event] of events.entries()) {
    const status = event.status ?? 'muted';
    const dotChar = FILLED_STATUSES.has(status) ? '●' : '○';
    const statusToken = ctx.theme.theme.status[status];

    const dot = ctx.style.styled(statusToken, dotChar);
    const desc = event.description ? ` ${event.description}` : '';
    lines.push(`${dot} ${event.label}${desc}`);

    if (i < events.length - 1) {
      lines.push(ctx.style.styled(lineToken, '│'));
    }
  }
  return lines.join('\n');
}
