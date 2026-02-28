import type { StylePort } from '../../ports/style.js';
import type { TokenValue } from '../../core/theme/tokens.js';
import type { RGB } from '../../core/theme/tokens.js';

export interface StyledCall {
  method: 'styled' | 'rgb' | 'hex' | 'bold';
  text: string;
  token?: TokenValue;
  color?: string | RGB;
}

export interface AuditStylePort extends StylePort {
  /** All recorded style calls in order. */
  readonly calls: readonly StyledCall[];
  /** Was the given token applied to text containing substring? */
  wasStyled(token: TokenValue, substring: string): boolean;
  /** Reset recorded calls. */
  reset(): void;
}

/**
 * Create a StylePort that records all styling calls for test assertions.
 *
 * Returns text unchanged (like `plainStyle`) so existing string assertions
 * still work. Records every call for post-hoc assertion via `calls` array
 * and `wasStyled()` convenience method.
 */
export function auditStyle(): AuditStylePort {
  const _calls: StyledCall[] = [];

  return {
    get calls(): readonly StyledCall[] {
      return _calls;
    },

    styled(token: TokenValue, text: string): string {
      _calls.push({ method: 'styled', text, token });
      return text;
    },

    rgb(r: number, g: number, b: number, text: string): string {
      _calls.push({ method: 'rgb', text, color: [r, g, b] });
      return text;
    },

    hex(color: string, text: string): string {
      _calls.push({ method: 'hex', text, color });
      return text;
    },

    bold(text: string): string {
      _calls.push({ method: 'bold', text });
      return text;
    },

    wasStyled(token: TokenValue, substring: string): boolean {
      return _calls.some(
        (c) => c.method === 'styled' && c.token === token && c.text.includes(substring),
      );
    },

    reset(): void {
      _calls.length = 0;
    },
  };
}
