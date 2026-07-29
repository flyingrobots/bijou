import { PSEUDO_MAP } from './tools.part03.js';

export function pseudoLocalize(value: string): string {
  let inPlaceholder = false;
  let result = '';
  for (const char of value) {
    if (char === '{') {
      inPlaceholder = true;
      result += char;
      continue;
    }
    if (char === '}') {
      inPlaceholder = false;
      result += char;
      continue;
    }
    if (inPlaceholder) {
      result += char;
      continue;
    }
    result += PSEUDO_MAP[char] ?? char;
  }
  return `[¡¡ ${result} ~~~ !!]`;
}
