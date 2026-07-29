---
title: RE-036 Packed Bijou Cells Surface Adapter
legend: RE
lane: release
priority: high
github_issue: 459
parent_issue: 457
status: complete
keywords:
  - runtime-engine
  - visor
  - packed-cells
  - surface
  - receipts
  - validation
  - v8.0.0
---

<!-- markdownlint-disable MD025 -->

# RE-036 Packed Bijou Cells Surface Adapter

Legend: [RE - Runtime Engine](../legends/RE-runtime-engine.md)

## Linked Work

- User story: [#459](https://github.com/flyingrobots/bijou/issues/459)
- V8 tracker: [#457](https://github.com/flyingrobots/bijou/issues/457)
- Broad source lineage:
  [#302](https://github.com/flyingrobots/bijou/issues/302)
- Landed artifact-bundle proof:
  [#458](https://github.com/flyingrobots/bijou/issues/458)
- V8 contract design:
  [DX-048 V8 Runtime Graph And Scene IR Contract](./DX-048-v8-runtime-graph-scene-ir-contract.md)
- Artifact-bundle design:
  [DX-049 VISOR Artifact Bundle Proof](./DX-049-visor-artifact-bundle-proof.md)
- VISOR coordination tracker:
  [flyingrobots/visor#1](https://github.com/flyingrobots/visor/issues/1)

## Decision Summary

Bijou will define `packed-bijou-cells/1` as a JSON-shaped terminal receipt
whose cell bytes use Bijou's existing ten-byte little-endian packed-cell
format, identified as `bijou-packed-cell-u8x10-le/1`. Glyphs use the
`unicode-grapheme-side-table/1` policy. The receipt carries exact dimensions,
bytes, grapheme side-table entries, scene-node provenance, focus facts, and
chroma policy facts. A public validator rejects malformed or non-canonical
receipts before any `Surface` constructor or renderer can sanitize them.

The adapter validates first, creates a packed Bijou `Surface`, copies the
validated bytes and side table without re-encoding cells, and marks the
resulting surface dirty. A successful adaptation therefore preserves the
receipt's byte sequence and side-table order exactly. It does not reinterpret
the receipt through `Cell` objects.

## Current Truth

Bijou already owns a packed terminal `Surface`:

- every cell occupies `10` bytes
- character identity is a little-endian unsigned 16-bit value
- direct character values below `0xF000` represent BMP code points
- values at or above `0xF000` index a grapheme side table
- foreground and background colors occupy three unsigned 8-bit channels each
- the flags byte records modifiers and the empty-cell bit
- the alpha byte records six-bit opacity plus foreground/background presence
  bits

The internal `createSurface()` boundary sanitizes dimensions. The internal
`decodeChar()` boundary substitutes a space when a side-table reference is
missing. Those behaviors are appropriate defensive fallbacks inside the
renderer, but they are not valid receipt verification. RE-036 must reject the
input before either fallback can hide a malformed external artifact.

DX-048 requires packed cells to map back to scene nodes. #459 also requires
focus and chroma metadata to be validated. The existing packed buffer does not
carry those facts, so the receipt must carry them beside the byte payload.

## Sponsor Human

A maintainer wants to inspect one portable terminal receipt, see the exact
scene, cell, glyph, color, focus, and provenance facts it claims, and adapt it
into a Bijou `Surface` without wondering whether the adapter repaired the
input.

## Sponsor Agent

An agent wants deterministic typed diagnostics for every invalid receipt path
and a byte-exact success path it can verify without rendering a live terminal,
scraping text, or depending on process-local state.

## Hill

Given a checked-in `packed-bijou-cells/1` fixture, Bijou can fail closed on
invalid shape, dimensions, bytes, glyphs, colors, scene provenance, focus, or
chroma metadata, then adapt a valid receipt into a packed `Surface` whose
dimensions, buffer bytes, side-table order, decoded cells, and scene ownership
remain inspectable and deterministic.

## Playback Questions

- Which exact packed-cell version and cell format does the receipt use?
- How many cells and bytes does the receipt claim?
- Which scene and scene nodes own each packed cell?
- Which side-table entry supplies each non-direct glyph?
- Which node is focused, and which nodes are focusable?
- Which color space, channel encoding, alpha encoding, and terminal-default
  policy govern the bytes?
- Can malformed dimensions, colors, glyph references, focus facts, or scene
  mappings reach `createSurface()`?
- Does adaptation preserve every byte and side-table entry without
  normalization?

## Scope

- Define the public `packed-bijou-cells/1` receipt type and version constants.
- Define a typed deterministic validation error with stable code and path.
- Validate the receipt's exact object shape and nested metadata shapes.
- Validate dimensions, cell count, stride, byte count, and byte values.
- Validate direct glyph values and side-table references.
- Validate canonical side-table entries and reference coverage.
- Validate foreground/background presence-bit color semantics.
- Validate scene-node provenance for every cell.
- Validate focus and chroma metadata.
- Adapt a valid receipt into Bijou's existing packed `Surface`.
- Prove byte-exact and side-table-exact adaptation with a checked-in fixture.
- Export the contract, validator, error, and adapter through the public Bijou
  package surface.

## Non-Goals

This cycle does not:

- change Bijou's existing packed-cell byte format
- make Geordi a Bijou dependency
- implement a Geordi packed-cell renderer
- implement terminal frame capture, replay, streaming, or compression
- define VISOR storage or indexing behavior
- add browser, WebGPU, image, shader, raster, or native-render targets
- normalize invalid receipts into accepted ones
- infer scene ownership from geometry after receipt creation
- validate an entire `ui-scene-ir/1` artifact against the declared scene hash
- redesign `Surface`, `Cell`, or terminal diff rendering
- expand #459 into the remaining #302 or #457 tracker scope

## Receipt Contract

The public receipt shape is:

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

The receipt is JSON-shaped. It does not carry `Uint8Array`, `Set`, `Map`,
functions, symbols, absolute paths, timestamps, process identifiers, terminal
handles, or mutable renderer objects.

## Dimension And Byte Laws

- `widthCells` and `heightCells` are positive safe integers.
- `widthCells * heightCells` is a safe integer.
- the receipt contains at most `100,000` cells.
- `cellCount * 10` is a safe integer.
- `bytes.length` equals `cellCount * 10`.
- every byte is an integer in the inclusive range `0` through `255`
- `cellFormatId` fixes the stride at `10`; no receipt-defined stride exists

The validator checks those laws before calling `createSurface()`. Zero,
negative, fractional, infinite, `NaN`, unsafe, overflowing, excessive, or
byte-length-mismatched dimensions fail.

## Glyph Laws

- the character value is decoded from byte offsets `0` and `1` as unsigned
  16-bit little-endian
- direct value `0` is rejected; an empty cell uses a space glyph plus the
  empty-cell flag
- direct values below `0xF000` must not be UTF-16 surrogate code points
- direct values are terminal-control safe graphemes of width `1`
- values at or above `0xF000` must reference an existing side-table entry
- every side-table entry is non-empty, terminal-control safe, and exactly one
  grapheme with terminal width `1`
- format-control and mark-only graphemes are rejected
- every side-table entry contains at most `256` UTF-16 code units and `32`
  UTF-8 bytes
- directly encodable values below `0xF000` are not valid side-table entries
- side-table entries are unique
- every side-table entry is referenced by at least one cell
- side-table order is authoritative and is never sorted, deduplicated, or
  reconstructed by the adapter

Rejecting unreferenced entries makes the receipt canonical and prevents
multiple byte-equivalent receipts from carrying arbitrary unused glyph data.

## Color And Modifier Laws

The six color-channel bytes are always unsigned 8-bit values by the byte law.
The alpha byte's low six bits encode opacity. Bit `6` records foreground
presence and bit `7` records background presence.

- when the foreground presence bit is unset, all three foreground channels
  are `0`
- when the background presence bit is unset, all three background channels
  are `0`
- an absent color means terminal default; it does not mean black
- the dashed modifier flag is valid only with the dotted/dashed underline
  value
- all other modifier and empty-cell bits retain their existing Bijou meaning

The adapter copies those bytes. It does not synthesize terminal defaults,
resolve theme tokens, quantize colors, or reconstruct modifier lists.

## Scene And Focus Laws

- `scene.sceneVersion` is exactly `ui-scene-ir/1`
- `scene.sceneHash` is a lowercase 64-character SHA-256 hexadecimal digest
- `scene.nodeIds` is non-empty, unique, and contains canonical non-empty ids
- `scene.cellNodeIds.length` equals the cell count
- every cell node id occurs in `scene.nodeIds`
- `focus.focusableNodeIds` is unique
- every focusable node id occurs in `scene.nodeIds`
- `focus.focusedNodeId` is either `null` or occurs in
  `focus.focusableNodeIds`

Every cell has an owning scene node. Background, empty, or padding cells must
name the scene node that intentionally emitted them; `null` ownership is not
accepted.

## Chroma Laws

The first receipt version supports one explicit chroma profile:

```text
colorSpace: srgb
channelEncoding: uint8
alphaEncoding: uint6
terminalDefaultEncoding: presence-bits
```

All four fields are mandatory and exact. Supporting another color space,
channel width, alpha encoding, or terminal-default policy requires a new
declared receipt or cell-format version. The validator does not silently
convert unsupported metadata.

## Validation Error Contract

Invalid input throws `PackedBijouCellsValidationError` with:

```typescript
interface PackedBijouCellsValidationErrorShape {
  readonly code: PackedBijouCellsValidationCode;
  readonly path: string;
  readonly detail: string;
}
```

The message format is deterministic:

```text
packed-bijou-cells/1 <code> at <path>: <detail>
```

Codes distinguish invalid shape, unknown field, wrong literal, invalid
dimension, invalid byte, byte-length mismatch, invalid glyph, invalid color,
invalid modifier, invalid scene mapping, invalid focus, and invalid chroma.
Paths use JSON-compatible segments such as `$.bytes[17]` and
`$.focus.focusedNodeId`.

Validation returns a fresh receipt value only after the entire object passes.
No partial receipt or partially created `Surface` escapes a failure.

## Surface Adapter Contract

`adaptPackedBijouCellsToSurface(input)` performs this sequence:

1. Parse and validate the unknown input.
2. Create a packed `Surface` with the validated positive dimensions.
3. Copy the validated bytes into `surface.buffer`.
4. Copy side-table entries in their declared order.
5. Mark all cells dirty for the first terminal render.
6. Return the packed `Surface`.

The following round-trip assertions are mandatory:

```text
surface.width === receipt.widthCells
surface.height === receipt.heightCells
Array.from(surface.buffer) deep-equals receipt.bytes
surface.sideTable deep-equals receipt.sideTable
```

Decoded cells may be inspected as secondary evidence. Re-encoding decoded
`Cell` objects is not the adaptation mechanism.

## Accessibility And Assistive Posture

Packed cells are visual terminal output, not an accessibility tree. The
receipt preserves scene-node and focus identity so a later inspector can link
the visual proof back to semantic roles and accessible names in
`ui-scene-ir/1`. This cycle makes no claim that packed bytes alone provide a
screen-reader representation.

The adapter must not erase focus identity or imply that terminal color is the
only carrier of meaning. Semantic accessibility remains owned by the source
artifact and scene contract.

## Localization And Directionality Posture

Side-table validation is Unicode-aware and accepts one terminal-width grapheme
per entry. This cycle does not implement bidirectional reordering, wide-cell
layout, locale-aware shaping, or grapheme fallback. A producer must lower those
concerns before emitting this one-cell-per-glyph receipt.

Rejecting control-bearing, multi-grapheme, or non-unit-width entries prevents
the adapter from creating a `Surface` whose geometry disagrees with the
receipt dimensions.

## Agent Inspectability And Explainability Posture

An agent can inspect:

- exact version and policy literals
- dimensions and derived cell count
- exact byte payload
- glyph side table and cell references
- scene hash and node inventory
- per-cell scene ownership
- focus inventory and active focus
- exact chroma profile
- a stable validation code and path for failures

No live terminal, component tree, renderer loop, hidden registry, or host state
is required to explain success or failure.

## Linked Invariants

- [The Buffer Holds Facts](../invariants/buffer-holds-facts.md): the receipt is
  portable data and the adapter preserves its packed facts.
- [Schemas Live At Boundaries](../invariants/schemas-live-at-boundaries.md):
  malformed receipts fail with stable code and path.
- [Tests Are the Spec](../invariants/tests-are-the-spec.md): executable
  fixtures define the accepted receipt and failure behavior.
- [Host APIs Stay Behind Adapters](../invariants/host-apis-stay-behind-adapters.md):
  validation and adaptation require no host, filesystem, process, or network
  capability.

## Implementation Outline

1. Synchronize `ROADMAP.md` and `BEARING.md` with the landed #468 proof and
   active #459 lane.
2. Add this design packet and a design-policy regression test.
3. Add a checked-in valid receipt fixture and focused tests that fail because
   the public validator and adapter do not exist.
4. Implement constants, public types, typed errors, exact-shape validation,
   and canonical field validation.
5. Implement glyph, color, scene, focus, and chroma validation.
6. Implement the byte-copying packed `Surface` adapter.
7. Export the public contract through `@flyingrobots/bijou`.
8. Update reference documentation, changelog, roadmap evidence, and this
   design's closeout.
9. Run focused tests, package typecheck, lint, Code Dojo gates, docs gates,
   generators, the full suite, and pre-push verification.

## Tests To Write First

- A checked-in valid fixture fails to import through the missing public API.
- The valid fixture adapts with exact dimensions, bytes, and side-table order.
- Unknown top-level and nested fields fail.
- Wrong version and policy literals fail.
- Zero, negative, fractional, unsafe, and overflowing dimensions fail.
- Byte-length mismatch and non-byte values fail.
- Missing side-table references fail instead of decoding as spaces.
- Surrogate direct glyph values fail.
- Empty, control-bearing, multi-grapheme, duplicate, wide, and unreferenced
  side-table entries fail.
- Nonzero RGB channels with an absent color presence bit fail.
- Invalid dashed-modifier combinations fail.
- Duplicate or empty scene-node ids fail.
- Missing and unknown per-cell scene ownership fails.
- Unknown, duplicate, or inconsistent focus ids fail.
- Unsupported chroma values fail without conversion.
- Adaptation never calls a renderer and never re-encodes cells through
  `Surface.set()` or `Surface.setRGB()`.

## Validation Plan

Focused proof:

```bash
npx vitest run tests/cycles/RE-036
```

Package and static proof:

```bash
npm run typecheck
npm run lint
npm run code-dojo:verify
npm run docs:inventory
git diff --check
```

Full repository proof:

```bash
npm run code-dojo:ci
```

If repository script names differ, use the documented owning commands and
record the exact successful commands in closeout.

## Acceptance Criteria

- `packed-bijou-cells/1` is a public documented receipt contract.
- The public validator rejects malformed shape, dimensions, bytes, glyphs,
  colors, scene mappings, focus facts, and chroma facts deterministically.
- A checked-in fixture adapts into a packed terminal `Surface`.
- Adapted dimensions, bytes, and side-table order exactly match the fixture.
- Every receipt cell maps to a declared `ui-scene-ir/1` node.
- Invalid side-table references never fall through to a replacement space.
- Invalid dimensions never reach dimension sanitation.
- No Geordi, VISOR, host, filesystem, network, or live-terminal dependency is
  introduced.
- Public types, errors, constants, validator, and adapter are exported.
- Focused and full repository gates pass.

## Closeout Notes

RE-036 exports `parsePackedBijouCellsReceipt()` and
`adaptPackedBijouCellsToSurface()` from `@flyingrobots/bijou`. The validator
rejects non-plain or inexact JSON shapes, unsafe or excessive dimensions,
non-byte payloads, non-canonical glyphs, terminal-default color drift, invalid
modifier combinations, incomplete scene ownership, inconsistent focus, and
unsupported chroma before surface allocation.

The checked `2` by `2` fixture preserves all `40` bytes and both side-table
entries through adaptation. It includes direct, combining, and private-use
glyph evidence; explicit and terminal-default colors; per-cell scene
ownership; and focus metadata. The adapter copies the payload directly into a
packed `Surface`, preserves side-table order, and marks every cell dirty
without calling `Surface.set()` or `Surface.setRGB()`.

Focused RE-036 verification passes `16` tests across `5` suites. Full
`npm run code-dojo:ci` verification passes `4,031` tests across `891` test
files.
Code Dojo holds its `62`-violation aggregate baseline: `37` file/context,
`25` code-size, `0` mock-ban, and `0` ESLint. `npm run docs:inventory`,
targeted Markdown lint, and `git diff --check` pass.

Contract shaping is commit `b1d57e95`; implementation and public documentation
are commit `669d10c7`. Remove `work-in-progress` from
[#459](https://github.com/flyingrobots/bijou/issues/459) only after review, CI,
merge, and issue closeout complete.
