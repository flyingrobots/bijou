/**
 * Text measurement and clipping utilities.
 *
 * Re-exports grapheme-aware width calculation and ANSI-safe clipping
 * from the `grapheme` and `clip` sub-modules.
 * @module
 */

export {
  isWideChar,
  segmentGraphemes,
  graphemeClusterWidth,
  graphemeWidth,
  sanitizeTerminalText,
  ANSI_CONTROL_SEQUENCE_RE,
  ANSI_OSC8_RE,
  ANSI_SGR_RE,
  stripAnsi,
} from './grapheme.js';

export { clipToWidth } from './clip.js';
export {
  wrapToWidth,
  prepareWrappedText,
  wrapPreparedTextToWidth,
} from './wrap.js';
export type {
  PreparedWrappedLine,
  PreparedWrappedText,
} from './wrap.js';
