import {
  type Surface,
  type TokenValue,
} from '../../packages/bijou/src/index.js';

export function renderSwatch(surface: Surface, hex: string, x: number, y: number, width: number): void {
  for (let offset = 0; offset < width && x + offset < surface.width; offset++) {
    surface.set(x + offset, y, {
      char: ' ',
      fg: hex,
      bg: hex,
      empty: false,
    });
  }
}

export function writeText(surface: Surface, x: number, y: number, text: string, token: TokenValue): void {
  let index = 0;
  for (const char of text) {
    if (x + index >= surface.width) break;
    surface.set(x + index, y, {
      char,
      fg: token.hex,
      bg: token.bg,
      modifiers: token.modifiers,
      empty: false,
    });
    index += 1;
  }
}
