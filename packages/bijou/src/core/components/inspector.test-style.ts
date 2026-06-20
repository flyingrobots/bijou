import type { StylePort } from '../../ports/style.js';
import { hexToRgb } from '../theme/color.js';

export function ansiStyle(): StylePort {
  function fg(color: string, text: string): string {
    const rgb = hexToRgb(color).join(';');
    return `\x1b[38;2;${rgb}m${text}\x1b[39m`;
  }

  function bg(color: string, text: string): string {
    const rgb = hexToRgb(color).join(';');
    return `\x1b[48;2;${rgb}m${text}\x1b[49m`;
  }

  function bold(text: string): string {
    return `\x1b[1m${text}\x1b[22m`;
  }

  return {
    styled(token, text) {
      let result = text;
      if (token.hex) result = fg(token.hex, result);
      if (token.bg) result = bg(token.bg, result);
      if (token.modifiers?.includes('bold')) result = bold(result);
      if (token.modifiers?.includes('dim')) result = `\x1b[2m${result}\x1b[22m`;
      if (token.modifiers?.includes('underline')) result = `\x1b[4m${result}\x1b[24m`;
      if (token.modifiers?.includes('inverse')) result = `\x1b[7m${result}\x1b[27m`;
      if (token.modifiers?.includes('strikethrough')) result = `\x1b[9m${result}\x1b[29m`;
      return result;
    },
    rgb(r, g, b, text) {
      return `\x1b[38;2;${[r, g, b].join(';')}m${text}\x1b[39m`;
    },
    hex(color, text) {
      return fg(color, text);
    },
    bgRgb(r, g, b, text) {
      return `\x1b[48;2;${[r, g, b].join(';')}m${text}\x1b[49m`;
    },
    bgHex(color, text) {
      return bg(color, text);
    },
    bold,
  };
}
