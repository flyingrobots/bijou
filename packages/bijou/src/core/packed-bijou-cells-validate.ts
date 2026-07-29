import {
  MAX_PACKED_BIJOU_CELLS,
  PACKED_BIJOU_CELL_FORMAT,
  PACKED_BIJOU_CELL_STRIDE,
  PACKED_BIJOU_CELLS_VERSION,
  PACKED_BIJOU_GLYPH_POLICY,
  type PackedBijouCellsReceipt,
} from './packed-bijou-cells-contract.js';
import {
  validateCellColorsAndModifiers,
  validatePackedBytes,
  validateSideTable,
} from './packed-bijou-cells-validate-cells.js';
import { validatePackedBijouMetadata } from './packed-bijou-cells-validate-metadata.js';
import {
  failPackedCells,
  literalAt,
  positiveSafeIntegerAt,
  recordAt,
} from './packed-bijou-cells-schema.js';

const RECEIPT_FIELDS = [
  'receiptVersion',
  'widthCells',
  'heightCells',
  'cellFormatId',
  'glyphPolicyId',
  'bytes',
  'sideTable',
  'scene',
  'focus',
  'chroma',
] as const;

export function parsePackedBijouCellsReceipt(
  input: unknown,
): PackedBijouCellsReceipt {
  const record = recordAt(input, '$', RECEIPT_FIELDS);
  literalAt(
    record['receiptVersion'],
    PACKED_BIJOU_CELLS_VERSION,
    '$.receiptVersion',
  );
  literalAt(record['cellFormatId'], PACKED_BIJOU_CELL_FORMAT, '$.cellFormatId');
  literalAt(
    record['glyphPolicyId'],
    PACKED_BIJOU_GLYPH_POLICY,
    '$.glyphPolicyId',
  );
  const widthCells = positiveSafeIntegerAt(
    record['widthCells'],
    '$.widthCells',
  );
  const heightCells = positiveSafeIntegerAt(
    record['heightCells'],
    '$.heightCells',
  );
  const cellCount = checkedCellCount(widthCells, heightCells);
  const expectedByteLength = cellCount * PACKED_BIJOU_CELL_STRIDE;
  const bytes = validatePackedBytes(record, expectedByteLength);
  const sideTable = validateSideTable(record, bytes);
  validateCellColorsAndModifiers(bytes);
  const metadata = validatePackedBijouMetadata(
    record['scene'],
    record['focus'],
    record['chroma'],
    cellCount,
  );

  return {
    receiptVersion: PACKED_BIJOU_CELLS_VERSION,
    widthCells,
    heightCells,
    cellFormatId: PACKED_BIJOU_CELL_FORMAT,
    glyphPolicyId: PACKED_BIJOU_GLYPH_POLICY,
    bytes,
    sideTable,
    ...metadata,
  };
}

function checkedCellCount(width: number, height: number): number {
  if (width > Math.floor(Number.MAX_SAFE_INTEGER / height)) {
    failPackedCells(
      'invalid-dimension',
      '$',
      'widthCells * heightCells exceeds the safe integer range',
    );
  }
  const cellCount = width * height;
  if (cellCount > MAX_PACKED_BIJOU_CELLS) {
    failPackedCells(
      'invalid-dimension',
      '$',
      `cell count exceeds ${String(MAX_PACKED_BIJOU_CELLS)}`,
    );
  }
  return cellCount;
}
