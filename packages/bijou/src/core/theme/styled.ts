import type { TokenValue } from './tokens.js';
import { getDefaultContext } from '../../context.js';

export function styled(token: TokenValue, text: string): string {
  return getDefaultContext().style.styled(token, text);
}

export function styledStatus(status: string, text?: string): string {
  const theme = getDefaultContext().theme;
  const token = theme.theme.status[status as keyof typeof theme.theme.status] as TokenValue | undefined;
  const fallback = theme.theme.status['muted' as keyof typeof theme.theme.status] as TokenValue | undefined;
  const resolved = token ?? fallback;
  const label = text ?? status;
  if (!resolved) return label;
  return getDefaultContext().style.styled(resolved, label);
}
