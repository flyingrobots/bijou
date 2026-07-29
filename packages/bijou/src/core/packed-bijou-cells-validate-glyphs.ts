import { SIDE_TABLE_THRESHOLD } from './render/packed-cell.js';
import {
  MAX_PACKED_BIJOU_SIDE_TABLE_ENTRIES,
  PACKED_BIJOU_CELL_STRIDE,
} from './packed-bijou-cells-contract.js';
import {
  isCanonicalSideTableGlyph,
  isSafeUnitGlyph,
} from './packed-bijou-cells-glyph-policy.js';
import {
  arrayAt,
  failPackedCells,
  type JsonRecord,
} from './packed-bijou-cells-schema.js';

export function validateSideTable(
  record: JsonRecord,
  bytes: readonly number[],
): string[] {
  const raw = arrayAt(
    record['sideTable'],
    '$.sideTable',
    MAX_PACKED_BIJOU_SIDE_TABLE_ENTRIES,
  );
  const seen = new Set<string>();
  const sideTable = raw.map((value, index) => {
    const path = `$.sideTable[${String(index)}]`;
    if (typeof value !== 'string' || !isCanonicalSideTableGlyph(value)) {
      failPackedCells(
        'invalid-glyph',
        path,
        'expected one terminal-safe grapheme of width 1',
      );
    }
    if (seen.has(value)) {
      failPackedCells('invalid-glyph', path, 'duplicate glyph');
    }
    seen.add(value);
    return value;
  });

  const references = validateCellGlyphs(bytes, sideTable.length);
  for (let index = 0; index < sideTable.length; index += 1) {
    if (!references.has(index)) {
      failPackedCells(
        'invalid-glyph',
        `$.sideTable[${String(index)}]`,
        'glyph is not referenced by any cell',
      );
    }
  }
  return sideTable;
}

function validateCellGlyphs(
  bytes: readonly number[],
  sideTableLength: number,
): Set<number> {
  const references = new Set<number>();
  for (
    let offset = 0;
    offset < bytes.length;
    offset += PACKED_BIJOU_CELL_STRIDE
  ) {
    const code = byte(bytes, offset) | (byte(bytes, offset + 1) << 8);
    if (code >= SIDE_TABLE_THRESHOLD) {
      const index = code - SIDE_TABLE_THRESHOLD;
      if (index >= sideTableLength) {
        failPackedCells(
          'invalid-glyph',
          `$.bytes[${String(offset)}]`,
          `side-table index ${String(index)} does not exist`,
        );
      }
      references.add(index);
    } else if (code >= 0xd800 && code <= 0xdfff) {
      failPackedCells(
        'invalid-glyph',
        `$.bytes[${String(offset)}]`,
        'direct glyph cannot be a UTF-16 surrogate',
      );
    } else if (code !== 0 && !isSafeUnitGlyph(String.fromCharCode(code))) {
      failPackedCells(
        'invalid-glyph',
        `$.bytes[${String(offset)}]`,
        'direct glyph must be terminal safe and width 1',
      );
    }
  }
  return references;
}

function byte(bytes: readonly number[], index: number): number {
  return bytes[index] ?? 0;
}
