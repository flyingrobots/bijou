export const PACKED_BIJOU_CELLS_VERSION = 'packed-bijou-cells/1' as const;
export const PACKED_BIJOU_CELL_FORMAT = 'bijou-packed-cell-u8x10-le/1' as const;
export const PACKED_BIJOU_GLYPH_POLICY =
  'unicode-grapheme-side-table/1' as const;
export const PACKED_BIJOU_SCENE_VERSION = 'ui-scene-ir/1' as const;
export const PACKED_BIJOU_CELL_STRIDE = 10;
export const MAX_PACKED_BIJOU_CELLS = 100_000;
export const MAX_PACKED_BIJOU_GLYPH_CODE_UNITS = 256;
export const MAX_PACKED_BIJOU_SIDE_TABLE_ENTRIES = 0x1000;

export const PACKED_BIJOU_CELLS_VALIDATION_CODES = [
  'invalid-shape',
  'unknown-field',
  'wrong-literal',
  'invalid-dimension',
  'invalid-byte',
  'byte-length-mismatch',
  'invalid-glyph',
  'invalid-color',
  'invalid-modifier',
  'invalid-scene',
  'invalid-focus',
  'invalid-chroma',
] as const;

export type PackedBijouCellsValidationCode =
  (typeof PACKED_BIJOU_CELLS_VALIDATION_CODES)[number];

export interface PackedBijouCellsScene {
  readonly sceneVersion: typeof PACKED_BIJOU_SCENE_VERSION;
  readonly sceneHash: string;
  readonly nodeIds: readonly string[];
  readonly cellNodeIds: readonly string[];
}

export interface PackedBijouCellsFocus {
  readonly focusedNodeId: string | null;
  readonly focusableNodeIds: readonly string[];
}

export interface PackedBijouCellsChroma {
  readonly colorSpace: 'srgb';
  readonly channelEncoding: 'uint8';
  readonly alphaEncoding: 'uint6';
  readonly terminalDefaultEncoding: 'presence-bits';
}

export interface PackedBijouCellsReceipt {
  readonly receiptVersion: typeof PACKED_BIJOU_CELLS_VERSION;
  readonly widthCells: number;
  readonly heightCells: number;
  readonly cellFormatId: typeof PACKED_BIJOU_CELL_FORMAT;
  readonly glyphPolicyId: typeof PACKED_BIJOU_GLYPH_POLICY;
  readonly bytes: readonly number[];
  readonly sideTable: readonly string[];
  readonly scene: PackedBijouCellsScene;
  readonly focus: PackedBijouCellsFocus;
  readonly chroma: PackedBijouCellsChroma;
}

export class PackedBijouCellsValidationError extends Error {
  override readonly name = 'PackedBijouCellsValidationError';

  constructor(
    readonly code: PackedBijouCellsValidationCode,
    readonly path: string,
    readonly detail: string,
  ) {
    super(`${PACKED_BIJOU_CELLS_VERSION} ${code} at ${path}: ${detail}`);
  }
}
