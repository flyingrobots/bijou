import {
  graphemeClusterWidth,
  sanitizePlainTerminalText,
  segmentGraphemes,
} from './text/grapheme.js';
import { SIDE_TABLE_THRESHOLD } from './render/packed-cell.js';
import {
  MAX_PACKED_BIJOU_GLYPH_CODE_UNITS,
  MAX_PACKED_BIJOU_GLYPH_UTF8_BYTES,
} from './packed-bijou-cells-contract.js';

const utf8Encoder = new TextEncoder();

export function isCanonicalSideTableGlyph(value: string): boolean {
  return isSafeUnitGlyph(value) && !isDirectlyEncodableGlyph(value);
}

export function isSafeUnitGlyph(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= MAX_PACKED_BIJOU_GLYPH_CODE_UNITS &&
    utf8Encoder.encode(value).length <= MAX_PACKED_BIJOU_GLYPH_UTF8_BYTES &&
    !hasTerminalControl(value) &&
    !hasUnsafeFormat(value) &&
    hasVisibleBase(value) &&
    sanitizePlainTerminalText(value) === value &&
    segmentGraphemes(value).length === 1 &&
    graphemeClusterWidth(value) === 1
  );
}

function isDirectlyEncodableGlyph(value: string): boolean {
  return value.length === 1 && value.charCodeAt(0) < SIDE_TABLE_THRESHOLD;
}

function hasVisibleBase(value: string): boolean {
  return Array.from(value).some(
    (character) =>
      !/^[\p{M}\p{Cf}\p{Default_Ignorable_Code_Point}]$/u.test(character),
  );
}

function hasUnsafeFormat(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0);
    if (codePoint === 0x200c || codePoint === 0x200d) return false;
    if (
      codePoint !== undefined &&
      codePoint >= 0xe0020 &&
      codePoint <= 0xe007f
    ) {
      return false;
    }
    return /^\p{Cf}$/u.test(character);
  });
}

function hasTerminalControl(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0);
    return (
      codePoint !== undefined &&
      (codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f))
    );
  });
}
