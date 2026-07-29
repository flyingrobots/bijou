import type { ChalkInstance } from 'chalk';
import type { TokenValue } from '@flyingrobots/bijou';

const UNDERLINE_VARIANT_SGR: Readonly<Record<string, string>> = {
  'curly-underline': '\x1b[4:3m',
  'dotted-underline': '\x1b[4:4m',
  'dashed-underline': '\x1b[4:5m',
};
const UNDERLINE_RESET = '\x1b[24m';

function applyModifiers(
  instance: ChalkInstance,
  modifiers?: TokenValue['modifiers'],
): ChalkInstance {
  if (modifiers === undefined) return instance;
  let result = instance;
  for (const modifier of modifiers) {
    switch (modifier) {
      case 'bold':
        result = result.bold;
        break;
      case 'dim':
        result = result.dim;
        break;
      case 'strikethrough':
        result = result.strikethrough;
        break;
      case 'inverse':
        result = result.inverse;
        break;
      case 'underline':
        result = result.underline;
        break;
      case 'curly-underline':
      case 'dotted-underline':
      case 'dashed-underline':
        break;
      default: {
        const exhaustive: never = modifier;
        void exhaustive;
      }
    }
  }
  return result;
}

function applyUnderlineVariants(
  text: string,
  ansiEnabled: boolean,
  modifiers?: TokenValue['modifiers'],
): string {
  if (!ansiEnabled || modifiers === undefined) return text;
  let result = text;
  for (const modifier of modifiers) {
    const sgr = UNDERLINE_VARIANT_SGR[modifier];
    if (sgr !== undefined) {
      result = sgr + result + UNDERLINE_RESET;
    }
  }
  return result;
}

function styleCacheKey(token: TokenValue): string {
  return [token.hex, token.bg, token.modifiers?.join(',') ?? ''].join('|');
}

function compileStyled(
  instance: ChalkInstance,
  ansiEnabled: boolean,
  token: TokenValue,
): (text: string) => string {
  const base = applyModifiers(
    token.hex ? instance.hex(token.hex) : instance,
    token.modifiers,
  );
  const background = token.bg ? instance.bgHex(token.bg) : null;
  const modifiers = token.modifiers;

  return (text: string): string => {
    let result = base(text);
    result = applyUnderlineVariants(result, ansiEnabled, modifiers);
    return background === null ? result : background(result);
  };
}

export function createChalkTokenStyler(
  instance: ChalkInstance,
  ansiEnabled: boolean,
): (token: TokenValue, text: string) => string {
  const styledCache = new Map<string, (text: string) => string>();
  return (token, text) => {
    if (!ansiEnabled) return text;
    const key = styleCacheKey(token);
    let styler = styledCache.get(key);
    if (styler === undefined) {
      styler = compileStyled(instance, ansiEnabled, token);
      styledCache.set(key, styler);
    }
    return styler(text);
  };
}
