import { segmenter } from './grapheme.part01.js';
import {
  restoreTerminalSequences,
  stashTerminalSequences,
  stripUnsafeControlChars,
} from './grapheme.part03.js';

// ---------------------------------------------------------------------------
// Grapheme segmentation
// ---------------------------------------------------------------------------

/**
 * Split a string into an array of grapheme clusters.
 *
 * Each element is a single user-perceived character (handles combining
 * marks, ZWJ sequences, flag pairs, skin tones, etc.).
 *
 * @param str - Input string to segment.
 * @returns Array of grapheme cluster strings.
 */
export function segmentGraphemes(str: string): string[] {
  const segments = segmenter().segment(str);
  const result: string[] = [];
  for (const { segment } of segments) {
    result.push(segment);
  }
  return result;
}
// ---------------------------------------------------------------------------
// ANSI stripping
// ---------------------------------------------------------------------------

/**
 * Pattern matching ANSI SGR escape sequences (e.g. `\x1b[31m`).
 *
 * Exported for reuse by text utilities that need to strip terminal
 * style escapes before measuring or clipping visible content.
 */
// eslint-disable-next-line no-control-regex
export const ANSI_SGR_RE = /\x1b\[[0-9;]*m/;
/**
 * Pattern matching OSC 8 hyperlink control sequences.
 *
 * This strips the invisible open/close control segments while preserving the
 * visible linked text between them.
 */
// eslint-disable-next-line no-control-regex
export const ANSI_OSC8_RE = /\x1b]8;;[^\x1b\x07]*(?:\x1b\\|\x07)/g;
/**
 * Pattern matching broad ANSI control sequences (CSI, OSC, DCS, APC, etc.).
 *
 * Used for sanitizing untrusted terminal text at string-entry boundaries.
 * SGR and OSC 8 sequences can be temporarily preserved by higher-level helpers
 * when a caller intentionally opts into styled parsing.
 */
export const ANSI_CONTROL_SEQUENCE_RE =
  // eslint-disable-next-line no-control-regex
  /\x1b(?:\[[0-?]*[ -/]*[@-~]|\][^\x1b\x07]*(?:\x1b\\|\x07)|[PX^_][\s\S]*?(?:\x1b\\|\x07)|[@-_])/g;
export interface SanitizeTerminalTextOptions {
  /** Preserve ANSI SGR styling escapes such as `\x1b[31m`. */
  readonly allowAnsiStyling?: boolean;
  /** Preserve OSC 8 hyperlink control sequences. */
  readonly allowHyperlinks?: boolean;
  /** Replacement width for literal tabs. Defaults to 2 spaces. */
  readonly tabWidth?: number;
}
/**
 * Strip all ANSI SGR escape sequences from a string.
 *
 * @param str - Input string potentially containing ANSI codes.
 * @returns The string with all ANSI SGR sequences removed.
 */
export function stripAnsi(str: string): string {
  return str
    .replace(ANSI_OSC8_RE, '')
    .replace(new RegExp(ANSI_SGR_RE, 'g'), '');
}
/**
 * Sanitize raw terminal text before it crosses into the surface model.
 *
 * Removes destructive ANSI/control sequences and normalizes tabs/newlines so
 * untrusted content cannot inject cursor movement or clear-screen behavior when
 * later rendered back out through {@link surfaceToString} or the diff writer.
 *
 * By default this removes all ANSI sequences. Callers that intentionally parse
 * styled content can preserve SGR and/or OSC 8 sequences with the option flags.
 */
export function sanitizeTerminalText(
  str: string,
  options: SanitizeTerminalTextOptions = {},
): string {
  const allowAnsiStyling = options.allowAnsiStyling ?? false;
  const allowHyperlinks = options.allowHyperlinks ?? false;
  const tabWidth = Math.max(1, Math.floor(options.tabWidth ?? 2));
  const placeholders: string[] = [];

  let text = str.replace(/\r\n?/g, '\n').replace(/\t/g, ' '.repeat(tabWidth));

  if (allowHyperlinks) {
    text = stashTerminalSequences(text, ANSI_OSC8_RE, placeholders);
  }
  if (allowAnsiStyling) {
    text = stashTerminalSequences(
      text,
      new RegExp(ANSI_SGR_RE, 'g'),
      placeholders,
    );
  }

  text = stripUnsafeControlChars(text.replace(ANSI_CONTROL_SEQUENCE_RE, ''));

  return restoreTerminalSequences(text, placeholders);
}
