// Text / grapheme utilities
export {
  forceTextPresentation,
  TEXT_PRESENTATION_SELECTOR,
  isWideChar,
  segmentGraphemes,
  graphemeClusterWidth,
  graphemeWidth,
  sanitizeTerminalText,
  sanitizePlainTerminalText,
  prepareWrappedText,
  wrapPreparedTextToWidth,
  clipToWidth,
  wrapToWidth,
  ANSI_CONTROL_SEQUENCE_RE,
  ANSI_SGR_RE,
  stripAnsi,
} from './core/text/index.js';

export type {
  PreparedWrappedLine,
  PreparedWrappedText,
} from './core/text/index.js';

// Detection
export {
  detectOutputMode,
  detectColorScheme,
  type OutputMode,
  type ColorScheme,
} from './core/detect/index.js';
