import type { TokenValue } from './tokens.js';
import { getDefaultContext } from '../../context.js';

/**
 * Apply a token's color and modifiers to a string using the default context's style port.
 *
 * @deprecated Reaches for the global default context singleton, violating
 *   dependency inversion. Use `ctx.style.styled(token, text)` instead.
 *
 * @param token - Token whose hex color and modifiers are applied.
 * @param text - Text to style.
 * @returns Styled text string.
 */
export function styled(token: TokenValue, text: string): string {
  return getDefaultContext().style.styled(token, text);
}

/**
 * Style text using the token for a given status key, falling back to `muted` if the key is unknown.
 *
 * @deprecated Reaches for the global default context singleton, violating
 *   dependency inversion. Use `ctx.semantic(status)` with
 *   `ctx.style.styled()` instead.
 *
 * @param status - Status key to look up in the current theme.
 * @param text - Text to display (defaults to the status key itself).
 * @returns Styled text string.
 */
export function styledStatus(status: string, text?: string): string {
  const theme = getDefaultContext().theme;
  const statusTokens = new Map(Object.entries(theme.theme.status));
  const token = statusTokens.get(status);
  const fallback = statusTokens.get('muted');
  const resolved = token ?? fallback;
  const label = text ?? status;
  if (!resolved) return label;
  return getDefaultContext().style.styled(resolved, label);
}
