import chalk, { Chalk, type ChalkInstance } from 'chalk';
import type { StylePort, TokenValue } from '@flyingrobots/bijou';

export interface ChalkStyleOptions {
  noColor?: boolean;
  /** Explicit chalk color level override: 0=none, 1=ansi16, 2=ansi256, 3=truecolor */
  level?: 0 | 1 | 2 | 3;
}

export function chalkStyle(noColor?: boolean): StylePort;
export function chalkStyle(options?: ChalkStyleOptions): StylePort;
export function chalkStyle(arg?: boolean | ChalkStyleOptions): StylePort {
  const opts = typeof arg === 'boolean' ? { noColor: arg } : (arg ?? {});
  const isNoColor = opts.noColor ?? false;
  const instance: ChalkInstance = opts.level !== undefined
    ? new Chalk({ level: opts.level })
    : chalk;

  function applyModifiers(c: ChalkInstance, modifiers?: TokenValue['modifiers']): ChalkInstance {
    if (modifiers === undefined) return c;
    let result = c;
    for (const mod of modifiers) {
      switch (mod) {
        case 'bold':          result = result.bold; break;
        case 'dim':           result = result.dim; break;
        case 'strikethrough': result = result.strikethrough; break;
        case 'inverse':       result = result.inverse; break;
        default: {
          const _exhaustive: never = mod;
          void _exhaustive;
        }
      }
    }
    return result;
  }

  return {
    styled(token: TokenValue, text: string): string {
      if (isNoColor) return text;
      const base: ChalkInstance = instance.hex(token.hex);
      return applyModifiers(base, token.modifiers)(text);
    },

    rgb(r: number, g: number, b: number, text: string): string {
      if (isNoColor) return text;
      return instance.rgb(r, g, b)(text);
    },

    hex(color: string, text: string): string {
      if (isNoColor) return text;
      return instance.hex(color)(text);
    },

    bold(text: string): string {
      if (isNoColor) return text;
      return instance.bold(text);
    },
  };
}
