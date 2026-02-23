import type { StylePort } from '../../ports/style.js';
import type { TokenValue } from '../../core/theme/tokens.js';

export function plainStyle(): StylePort {
  return {
    styled(_token: TokenValue, text: string): string {
      return text;
    },
    rgb(_r: number, _g: number, _b: number, text: string): string {
      return text;
    },
    hex(_color: string, text: string): string {
      return text;
    },
    bold(text: string): string {
      return text;
    },
  };
}
