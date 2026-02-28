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
} from './grapheme.js';

export { clipToWidth } from './clip.js';
