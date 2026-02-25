import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import type { BaseStatusKey } from '../theme/tokens.js';
import { getDefaultContext } from '../../context.js';

export interface TimelineEvent {
  label: string;
  description?: string;
  status?: BaseStatusKey;
}

export interface TimelineOptions {
  lineToken?: TokenValue;
  ctx?: BijouContext;
}

function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

const FILLED_STATUSES: Set<string> = new Set(['success', 'error', 'warning', 'info', 'active']);

function statusLabel(status: BaseStatusKey): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

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
