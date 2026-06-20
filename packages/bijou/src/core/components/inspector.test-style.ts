import type { StylePort } from '../../ports/style.js';
import { hexToRgb } from '../theme/color.js';

const ESC = String.fromCharCode(27);

function sgr(code: string, text: string, reset: string): string {
  return `${ESC}[${code}m${text}${ESC}[${reset}m`;
}

export function ansiStyle(): StylePort {
  function fg(color: string, text: string): string {
    const rgb = hexToRgb(color).join(';');
    return sgr(`38;2;${rgb}`, text, '39');
  }

  function bg(color: string, text: string): string {
    const rgb = hexToRgb(color).join(';');
    return sgr(`48;2;${rgb}`, text, '49');
  }

  function bold(text: string): string {
    return sgr('1', text, '22');
  }

  return {
    styled(token, text) {
      let result = text;
      if (token.hex) result = fg(token.hex, result);
      if (token.bg) result = bg(token.bg, result);
      if (token.modifiers?.includes('bold')) result = bold(result);
      if (token.modifiers?.includes('dim')) result = sgr('2', result, '22');
      if (token.modifiers?.includes('underline')) result = sgr('4', result, '24');
      if (token.modifiers?.includes('inverse')) result = sgr('7', result, '27');
      if (token.modifiers?.includes('strikethrough')) result = sgr('9', result, '29');
      return result;
    },
    rgb(r, g, b, text) {
      return sgr(`38;2;${[r, g, b].join(';')}`, text, '39');
    },
    hex(color, text) {
      return fg(color, text);
    },
    bgRgb(r, g, b, text) {
      return sgr(`48;2;${[r, g, b].join(';')}`, text, '49');
    },
    bgHex(color, text) {
      return bg(color, text);
    },
    bold,
  };
}
