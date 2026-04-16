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
  sanitizePlainTerminalText,
  ANSI_CONTROL_SEQUENCE_RE,
  ANSI_OSC8_RE,
  ANSI_SGR_RE,
  stripAnsi,
} from './grapheme.js';

export {
  forceTextPresentation,
  TEXT_PRESENTATION_SELECTOR,
} from './icon-presentation.js';

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
