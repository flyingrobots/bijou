import type { TokenValue } from '../core/theme/tokens.js';

export interface StylePort {
  styled(token: TokenValue, text: string): string;
  rgb(r: number, g: number, b: number, text: string): string;
  hex(color: string, text: string): string;
  bold(text: string): string;
}
