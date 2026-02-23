import chalk, { type ChalkInstance } from 'chalk';
import type { TokenValue } from './tokens.js';
import { getTheme, isNoColor } from './resolve.js';

/**
 * Creates a chalk instance from a theme token.
 *
 * - When NO_COLOR is set, hex coloring is skipped but modifiers (bold/dim/strikethrough) still apply.
 * - chalk v5 also respects NO_COLOR natively, providing double safety.
 */
export function chalkFromToken(token: TokenValue): ChalkInstance {
  const noColor = isNoColor();
  let c: ChalkInstance = noColor ? chalk : chalk.hex(token.hex);

  if (token.modifiers !== undefined) {
    for (const mod of token.modifiers) {
      switch (mod) {
        case 'bold':          c = c.bold; break;
        case 'dim':           c = c.dim; break;
        case 'strikethrough': c = c.strikethrough; break;
        case 'inverse':       c = c.inverse; break;
        default: {
          const _exhaustive: never = mod;
          void _exhaustive;
        }
      }
    }
  }

  return c;
}

/** Apply a theme token to a string. Convenience wrapper around chalkFromToken. */
export function styled(token: TokenValue, text: string): string {
  return chalkFromToken(token)(text);
}

/** Apply a status-key token to a string. Falls back to 'muted' if status is not recognized. */
export function styledStatus(status: string, text?: string): string {
  const t = getTheme();
  const statusRecord = t.theme.status as Record<string, TokenValue | undefined>;
  const token = statusRecord[status] ?? t.theme.semantic.muted;
  return styled(token, text ?? status);
}
