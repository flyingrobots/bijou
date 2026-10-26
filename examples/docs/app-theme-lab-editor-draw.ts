import {
  graphemeClusterWidth,
  segmentGraphemes,
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
  for (const char of segmentGraphemes(text)) {
    const width = Math.max(1, graphemeClusterWidth(char));
    if (x + index + width > surface.width) break;
    surface.set(x + index, y, {
      char,
      fg: token.hex,
      bg: token.bg,
      modifiers: token.modifiers,
      empty: false,
    });
    for (let offset = 1; offset < width; offset++) {
      surface.set(x + index + offset, y, {
        char: '',
        fg: token.hex,
        bg: token.bg,
        modifiers: token.modifiers,
        empty: false,
      });
    }
    index += width;
  }
}
