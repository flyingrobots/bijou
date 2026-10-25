import { TextStyle } from './text-style.js';

export type TextElement = 'h1' | 'h2' | 'h3' | 'h4' | 'p';
export const TEXT_ELEMENTS: readonly TextElement[] = Object.freeze(['h1', 'h2', 'h3', 'h4', 'p']);

interface StyleSettings {
  readonly h1?: TextStyle;
  readonly h2?: TextStyle;
  readonly h3?: TextStyle;
  readonly h4?: TextStyle;
  readonly p?: TextStyle;
}

export class MarkdownStyles {
  readonly #settings: Readonly<Required<StyleSettings>>;

  public constructor(settings: StyleSettings = {}) {
    this.#settings = Object.freeze({
      h1: settings.h1 ?? new TextStyle('default', 24),
      h2: settings.h2 ?? new TextStyle('terminal', 20),
      h3: settings.h3 ?? new TextStyle('terminal', 16),
      h4: settings.h4 ?? new TextStyle('terminal', 12),
      p: settings.p ?? new TextStyle('terminal', 12),
    });
    Object.freeze(this);
  }

  public for(element: TextElement): TextStyle { return this.#settings[element]; }

  public with(element: TextElement, style: TextStyle): MarkdownStyles {
    return new MarkdownStyles({ ...this.#settings, [element]: style });
  }
}

export function isTextElement(value: string): value is TextElement {
  return TEXT_ELEMENTS.some((element) => element === value);
}

export function applyStyleFlag(styles: MarkdownStyles, flag: string, value: string): MarkdownStyles {
  const match = /^--(h[1-4]|p)-(font|size)$/u.exec(flag);
  const element = match?.[1];
  if (element === undefined || !isTextElement(element)) throw new Error(`Unknown style option: ${flag}`);
  const current = styles.for(element);
  return styles.with(element, match?.[2] === 'font'
    ? new TextStyle(value, current.size)
    : new TextStyle(current.font === 'terminal' ? 'default' : current.font, Number(value)));
}
