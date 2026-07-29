import { sanitizeTerminalText } from './grapheme.part02.js';

export interface SanitizePlainTerminalTextOptions {
  /**
   * Preserve literal newlines after sanitization.
   *
   * Plain inline content should usually leave this disabled so newlines cannot
   * escape into single-line surfaces or terminal payloads unexpectedly.
   */
  readonly preserveNewlines?: boolean;
  /** Replacement used when flattening one or more newlines. Defaults to a space. */
  readonly newlineReplacement?: string;
  /** Replacement width for literal tabs before flattening. Defaults to 2 spaces. */
  readonly tabWidth?: number;
}

/**
 * Default boundary for untrusted plain text that will become cells or inline
 * terminal payloads.
 *
 * This strips destructive control sequences, normalizes tabs, and flattens
 * multiline input unless the caller explicitly opts into preserving newlines.
 * Callers that intentionally preserve styling should use
 * {@link sanitizeTerminalText} with allow flags or route through
 * `parseAnsiToSurface()`.
 */
export function sanitizePlainTerminalText(
  str: string,
  options: SanitizePlainTerminalTextOptions = {},
): string {
  const preserveNewlines = options.preserveNewlines ?? false;
  const newlineReplacement = options.newlineReplacement ?? ' ';
  const text = sanitizeTerminalText(str, { tabWidth: options.tabWidth });
  if (preserveNewlines) return text;
  return text.replace(/\n+/g, newlineReplacement);
}
