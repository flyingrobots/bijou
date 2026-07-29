# Validate And Adapt Packed Bijou Cell Receipts

Use `parsePackedBijouCellsReceipt()` to validate an unknown
`packed-bijou-cells/1` value. Use `adaptPackedBijouCellsToSurface()` when the
validated bytes must become a Bijou terminal `Surface`.

The adapter preserves the receipt's dimensions, ten-byte cell records, and
grapheme side-table order. It does not normalize malformed input, reconstruct
cells, render a terminal frame, or validate the complete source scene.

## Public API

The package exports:

| Export | Contract |
| :--- | :--- |
| `parsePackedBijouCellsReceipt()` | Validate unknown input and return a fresh receipt |
| `adaptPackedBijouCellsToSurface()` | Validate unknown input and copy it into a packed `Surface` |
| `PackedBijouCellsValidationError` | Typed failure with `code`, `path`, and `detail` |
| `PACKED_BIJOU_CELLS_VERSION` | `packed-bijou-cells/1` |
| `PACKED_BIJOU_CELL_FORMAT` | `bijou-packed-cell-u8x10-le/1` |
| `PACKED_BIJOU_CELL_STRIDE` | `10` |
| `PACKED_BIJOU_GLYPH_POLICY` | `unicode-grapheme-side-table/1` |
| `PACKED_BIJOU_SCENE_VERSION` | `ui-scene-ir/1` |
| `MAX_PACKED_BIJOU_CELLS` | `100,000` |
| `MAX_PACKED_BIJOU_GLYPH_CODE_UNITS` | `256` per glyph |
| `MAX_PACKED_BIJOU_SIDE_TABLE_ENTRIES` | `4,096` |
| `PACKED_BIJOU_CELLS_VALIDATION_CODES` | Ordered validation-code inventory |
| `PackedBijouCellsReceipt` | Complete receipt type |
| `PackedBijouCellsScene` | Scene identity and per-cell ownership |
| `PackedBijouCellsFocus` | Focused and focusable scene identities |
| `PackedBijouCellsChroma` | Exact accepted chroma profile |
| `PackedBijouCellsValidationCode` | Validation-code union |

Import the functions and receipt type from `@flyingrobots/bijou`:

```typescript
import {
  adaptPackedBijouCellsToSurface,
  parsePackedBijouCellsReceipt,
  type PackedBijouCellsReceipt,
} from '@flyingrobots/bijou';
```

Validate unknown input without constructing a `Surface`:

```typescript
export function validateReceipt(
  input: unknown,
): PackedBijouCellsReceipt {
  return parsePackedBijouCellsReceipt(input);
}
```

Adapt unknown input after validation:

```typescript
export function adaptReceipt(input: unknown) {
  return adaptPackedBijouCellsToSurface(input);
}
```

Both functions reject invalid input with
`PackedBijouCellsValidationError`. Inspect its `code`, `path`, and `detail`
fields instead of parsing the message.

## Receipt Shape

Every field is required. Unknown or non-enumerable fields, accessors, symbols,
sparse arrays, and non-JSON-shaped objects are rejected.

```typescript
interface PackedBijouCellsReceipt {
  readonly receiptVersion: 'packed-bijou-cells/1';
  readonly widthCells: number;
  readonly heightCells: number;
  readonly cellFormatId: 'bijou-packed-cell-u8x10-le/1';
  readonly glyphPolicyId: 'unicode-grapheme-side-table/1';
  readonly bytes: readonly number[];
  readonly sideTable: readonly string[];
  readonly scene: {
    readonly sceneVersion: 'ui-scene-ir/1';
    readonly sceneHash: string;
    readonly nodeIds: readonly string[];
    readonly cellNodeIds: readonly string[];
  };
  readonly focus: {
    readonly focusedNodeId: string | null;
    readonly focusableNodeIds: readonly string[];
  };
  readonly chroma: {
    readonly colorSpace: 'srgb';
    readonly channelEncoding: 'uint8';
    readonly alphaEncoding: 'uint6';
    readonly terminalDefaultEncoding: 'presence-bits';
  };
}
```

The maximum accepted receipt contains `100,000` cells. The byte payload must
contain exactly ten unsigned bytes per cell.

## Cell And Glyph Rules

`cellFormatId` fixes each cell at ten bytes:

| Offsets | Meaning                                                  |
| :------ | :------------------------------------------------------- |
| `0..1`  | Unsigned 16-bit little-endian character value            |
| `2..4`  | Foreground red, green, and blue channels                 |
| `5..7`  | Background red, green, and blue channels                 |
| `8`     | Modifier and empty-cell flags                            |
| `9`     | Six-bit opacity plus foreground/background presence bits |

Character values below `0xF000` are direct Basic Multilingual Plane values.
Non-empty direct values must be terminal-control safe and have terminal width
`1`; UTF-16 surrogate values are rejected. Values at or above `0xF000` select
`sideTable[characterValue - 0xF000]`.

Each side-table entry must be unique, terminal-control safe, and exactly one
grapheme with terminal width `1`. An entry contains at most `256` UTF-16 code
units. Format-control and mark-only graphemes are rejected. Every entry must
be referenced by at least one cell. Side-table order is authoritative.

When a foreground or background presence bit is unset, the corresponding
three color channels must be zero. An absent color means terminal default, not
black. A dashed flag is valid only with the dotted/dashed underline bits.

## Scene, Focus, And Chroma Rules

`scene.sceneHash` is a lowercase SHA-256 hexadecimal digest.
`scene.nodeIds` is a unique non-empty inventory, and `scene.cellNodeIds`
contains one declared owner for every cell.

Every focusable node must occur in `scene.nodeIds`. `focusedNodeId` is either
`null` or a member of `focusableNodeIds`.

Version `1` accepts only this chroma profile:

```text
colorSpace: srgb
channelEncoding: uint8
alphaEncoding: uint6
terminalDefaultEncoding: presence-bits
```

No color-space or channel conversion occurs.

## Diagnostics

The deterministic message format is:

```text
packed-bijou-cells/1 <code> at <path>: <detail>
```

| Code                   | Meaning                                                     |
| :--------------------- | :---------------------------------------------------------- |
| `invalid-shape`        | The value is not the required exact JSON shape              |
| `unknown-field`        | An object or array has an unowned field                     |
| `wrong-literal`        | A version or policy identifier is unsupported               |
| `invalid-dimension`    | Dimensions are non-positive, unsafe, excessive, or overflow |
| `invalid-byte`         | A payload value is not an integer from `0` through `255`    |
| `byte-length-mismatch` | The payload is not exactly ten bytes per cell               |
| `invalid-glyph`        | A direct glyph, side-table entry, or reference is invalid   |
| `invalid-color`        | Terminal-default color channels are nonzero                 |
| `invalid-modifier`     | Modifier bits describe an invalid combination               |
| `invalid-scene`        | Scene identity or per-cell ownership is invalid             |
| `invalid-focus`        | Focus identity is duplicate, unknown, or inconsistent       |
| `invalid-chroma`       | The chroma profile is unsupported                           |

Paths identify the rejected location, for example `$.bytes[17]` or
`$.focus.focusedNodeId`.

## Adapter Result

`adaptPackedBijouCellsToSurface()` validates the complete receipt before it
calls `createSurface()`. On success:

```text
surface.width === receipt.widthCells
surface.height === receipt.heightCells
Array.from(surface.buffer) deep-equals receipt.bytes
surface.sideTable deep-equals receipt.sideTable
```

All surface cells are marked dirty for their first render. Scene, focus, and
chroma metadata remain receipt evidence; they are not stored inside
`Surface`.

## Fixture And Verification

The checked fixture exercises direct glyphs, side-table glyphs, explicit and
terminal-default colors, scene ownership, and focus:

- [Packed Bijou cell fixture](../../tests/fixtures/RE-036/packed-bijou-cells.v1.json)
- [RE-036 design record](../design/RE-036-packed-bijou-cells-surface-adapter.md)

Run the focused contract evidence:

```bash
npx vitest run tests/cycles/RE-036
```
