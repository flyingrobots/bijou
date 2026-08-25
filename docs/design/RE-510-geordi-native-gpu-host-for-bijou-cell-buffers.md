---
title: RE-510 Geordi Native GPU Host For Bijou Cell Buffers
legend: RE
lane: cool-ideas
priority: medium
github_issue: 510
status: proposed
keywords:
  - runtime-engine
  - geordi
  - gpu
  - wgpu
  - packed-cells
  - native-host
  - terminal
  - v10.0.0
---

<!-- markdownlint-disable MD025 -->

# RE-510 Geordi Native GPU Host For Bijou Cell Buffers

Legend: [RE - Runtime Engine](../legends/RE-runtime-engine.md)

## Linked Work

- Design story:
  [#510](https://github.com/flyingrobots/bijou/issues/510)
- Landed packed-cell contract:
  [RE-036 Packed Bijou Cells Surface Adapter](./RE-036-packed-bijou-cells-surface-adapter.md)
  and [#459](https://github.com/flyingrobots/bijou/issues/459)
- Portable Bijou endpoint direction:
  [DX-043 Portable Bijou Blocks And Multi-Endpoint IR](./DX-043-portable-bijou-blocks-and-multi-endpoint-ir.md)
- Shared scene and renderer ownership:
  [DX-042 Shared UI Scene IR And Bijou Render Target](./DX-042-shared-ui-scene-ir-and-bijou-render-target.md)
- Geordi-backed title-screen candidate:
  [#321](https://github.com/flyingrobots/bijou/issues/321) and
  [DF-074 Fluid Triangle Title Screen](./DF-074-fluid-triangle-title-screen.md)
- Mutable raster precursor:
  [#346](https://github.com/flyingrobots/bijou/issues/346)
- V10 renderer and host boundary:
  [Roadmap](../ROADMAP.md#v100-renderer-and-host-systems-integration)

## Decision Summary

Bijou should preserve `packed-bijou-cells/1` and
`bijou-packed-cell-u8x10-le/1` as its canonical terminal-cell receipt and byte
format. Geordi may consume that contract and derive an endpoint-specific,
GPU-aligned cell-instance buffer, glyph assets, and native render receipt.

The first honest native-GPU proof is:

```text
checked packed-bijou-cells/1 fixture
  -> strict Geordi consumer validation
    -> CPU preparation of GPU cell and glyph instances
      -> wgpu offscreen texture or winit swapchain
        -> instanced cell-grid rendering
          -> probes and native endpoint receipt
```

This first proof makes the GPU responsible for rasterizing and presenting the
cell grid. It does not make the GPU responsible for Bijou application state,
layout, focus, glyph selection, or cell semantics.

A later proof may let a Geordi compute pipeline produce prepared cell data and
feed it directly into the presentation pass without a full-frame RGBA readback.
That is a separate equivalence claim and must remain downstream of the CPU
reference.

A generic TTY does not accept a GPU buffer. Bijou's existing terminal endpoint
must continue to lower `Surface` differences into terminal control sequences.
An actual zero-ANSI GPU cell path therefore requires one of these explicit
hosts:

1. a Geordi native window that presents Bijou cell semantics;
2. a terminal-emulator integration that deliberately adopts the cell contract;
3. a raster terminal graphics protocol, which receives pixels rather than
   Bijou cell records and is therefore a different endpoint.

## Hill

Given one small checked-in `packed-bijou-cells/1` fixture, a Geordi native
endpoint can validate the artifact, prepare a GPU cell grid under one declared
font and chroma profile, render it without converting the grid to ANSI or a
full-frame CPU raster, and emit evidence that connects the presented pixels to
the exact source bytes, glyph assets, target profile, and probe policy.

## Sponsored Human

A Bijou application author wants terminal-grid interaction and layout with
native GPU presentation, fluid visual effects, and deterministic capture,
without rewriting the application as a canvas UI or giving a renderer authority
over component behavior.

## Sponsored Agent

An agent wants to inspect which cell bytes, glyph-run assets, target profile,
GPU preparation step, shader bundle, and backend produced a frame. It should be
able to distinguish semantic cell parity from backend-specific pixel evidence
without scraping a live terminal or trusting a screenshot.

## Playback Questions

1. Which Bijou receipt, cell-format version, scene hash, and cell bytes produced
   the native frame?
2. Did the endpoint consume every cell under an explicitly supported glyph,
   chroma, modifier, and opacity policy?
3. Which font pack, shaped glyph data, atlas, shader bundle, numeric profile,
   and GPU backend produced the pixels?
4. Did the GPU merely present CPU-authored cells, or did it also produce cell
   values?
5. Was any full-frame RGBA image read back to the CPU before presentation?
6. Was the result shown in a Geordi native window, transmitted as raster data to
   a graphics-protocol terminal, or written as ANSI to a generic TTY?
7. Which structural facts are portable across endpoints, and which pixel facts
   are valid only under the declared backend and probe policy?
8. What happens when a glyph, modifier, color policy, adapter feature, or host
   capability is unsupported?
9. Which semantic and accessible representation remains available when the GPU
   host is absent or inaccessible?
10. Can the ordinary terminal path remain byte-for-byte and behaviorally
    unchanged?

## Evidence Audit

This design was requested after comparing Bijou, Geordi, the project blog, and
`agy-readings`. The sources do not all have equal authority.

### Bijou: Implemented Cell And Terminal Boundaries

Current Bijou `origin/main` at `4412ec6db` provides the strongest evidence:

- `DX-043` already describes
  `ui-scene-ir/1 -> Geordi packed-cell renderer -> PackedBijouCells -> Bijou
  Surface -> terminal cells`, including CPU and GPU producers.
  `bijou::docs/design/DX-043-portable-bijou-blocks-and-multi-endpoint-ir.md#L345-L391@4412ec6db`
- `RE-036` has since defined and landed a JSON-shaped
  `packed-bijou-cells/1` receipt with a ten-byte little-endian cell format,
  grapheme side table, scene ownership, focus, and chroma facts.
  `bijou::docs/design/RE-036-packed-bijou-cells-surface-adapter.md#L40-L77@4412ec6db`
- A `PackedSurface` exposes a row-major `Uint8Array` and one render-dirty bit per
  cell.
  `bijou::packages/bijou/src/ports/surface-contract.ts#L69-L87@4412ec6db`
- The ordinary interactive endpoint still calls `renderDiff()` and writes
  minimal CUP/SGR output through the I/O port.
  `bijou::packages/bijou-tui/src/screen.ts#L107-L128@4412ec6db`

This establishes a usable CPU-side cell contract and an existing ANSI endpoint.
It does not establish a GPU consumer, native window host, terminal-emulator
plugin, or GPU-authored cell path.

### Geordi: Proposed Packed Cells And Native GPU Direction

Current Geordi `origin/main` at `f68160fcb` contains two directly relevant
designs:

- The portable Bijou endpoint design calls packed cells the most interesting
  near-term bridge. It proposes CPU, WASM, WebGPU, or native-GPU backends that
  produce one packed cell per terminal cell, reducing readback from a large RGBA
  frame to `cellCount * packedCellSize`.
  `geordi::docs/design/2026-06-portable-bijou-ui-render-endpoints.md#L172-L218@f68160fcb`
- The native Rust harness design says a renderer must not use a `wgpu` name
  until `wgpu` actually draws. It recommends `winit` plus `wgpu` when the proof
  needs to claim GPU-native rendering.
  `geordi::docs/design/2026-05-native-rust-render-harness.md#L15-L56@f68160fcb`
  `geordi::docs/design/2026-05-native-rust-render-harness.md#L193-L224@f68160fcb`

The Geordi design is explicit that packed-cell, WebGPU, and native-GPU endpoints
are proposed. Current Geordi documentation still lists WebGPU, Metal, Vulkan,
`wgpu`, and GPU shader parity as nonclaims.
`geordi::docs/end-to-end.md#L1678-L1690@f68160fcb`

Geordi therefore supplies the correct renderer doctrine and planned ownership
boundary, but no current implementation proves this design.

### Blog: Dated Audit, Not Runtime Authority

The tracked project-blog audit at `8f9c6259c` independently reached the same
maturity conclusion:

- Geordi's rectangle, bunny, and strict-text paths are bounded executable
  proofs.
- The Bunny-to-Geordi and Bijou-to-Geordi relationships were still designs,
  not shipped joins.
- Bijou's browser and packed-cell receipt slots were contract space rather than
  live endpoints at the audited revision.

Relevant records:

- `blog::profunctor-optics/findings/06-bunny-geordi-render-proof-stack.md#L34-L58@8f9c6259c`
- `blog::profunctor-optics/findings/06-bunny-geordi-render-proof-stack.md#L165-L180@8f9c6259c`
- `blog::profunctor-optics/findings/07-bijou-workbench-and-product-surface.md#L198-L205@8f9c6259c`

The blog corroborates the design boundary. It does not supersede current source
or executable evidence.

### `agy-readings`: Directional And Speculative Evidence

The tracked `agy-readings` material at `e6b57ebb2` assigns participant-facing
cell semantics to Bijou and artifact-, capability-, and asset-bound rendering
to Geordi.
`agy-readings::PROFUNCTOR_PLAN.md#L565-L571@e6b57ebb2`

Its Geordi notes also suggest:

- projecting pixels or terminal blocks through Bijou;
- a future WebGPU runtime;
- native and browser renderers sharing deterministic artifacts.

Those notes are architectural advice and review commentary, not an accepted
cell ABI, native-host design, or executable proof:

- `agy-readings::geordi/DOCS.md#L8-L12@e6b57ebb2`
- `agy-readings::geordi/IDEAS.md#L3-L15@e6b57ebb2`
- `agy-readings::geordi/honest-review.md#L1-L13@e6b57ebb2`

The user-owned, untracked Geordi note
`docs/geordi-ideas-brainstorm.md` was also inspected. It proposes a terminal
preview renderer and several Bijou/Geordi receipt combinations, but it does not
define native GPU consumption of the Bijou cell buffer. Because it is untracked,
it has no revision identity and is not design authority.

### External Host Constraints

The official
[kitty terminal graphics protocol](https://sw.kovidgoyal.net/kitty/graphics-protocol/)
accepts RGB, RGBA, or PNG raster data. Local clients may transfer raster data by
file or shared memory, and placements can be tied to terminal cells. The
protocol does not define a terminal-cell instance buffer or a way to import a
client-owned GPU buffer.

The official
[WGSL memory-layout specification](https://gpuweb.github.io/gpuweb/wgsl/#memory-layouts)
requires host and shader buffer producers to agree on explicit, aligned layouts.
Bijou's canonical ten-byte record is therefore not automatically a suitable
WGSL storage-structure ABI.

These sources support a strict host distinction. They do not prohibit a future
terminal-specific extension, but no such extension is part of this design's
current proof.

## Current Truth

### Canonical Bijou Cell Storage

Each canonical packed cell occupies ten bytes:

| Offset | Meaning |
| :--- | :--- |
| `0..1` | little-endian character or grapheme side-table reference |
| `2..4` | foreground sRGB channels |
| `5..7` | background sRGB channels |
| `8` | modifier and empty-cell flags |
| `9` | six-bit opacity and foreground/background presence bits |

The complete receipt also owns dimensions, side-table order, scene identity,
per-cell scene ownership, focus facts, and one exact chroma profile. The
validator rejects noncanonical data before a `Surface` can sanitize or repair
it.

### Ordinary Terminal Presentation

The current production endpoint is:

```text
Bijou model and update loop
  -> view
    -> Surface
      -> front/back cell diff
        -> CUP, SGR, UTF-8, and screen-control bytes
          -> stdout / PTY
            -> terminal emulator
              -> terminal-owned rasterizer and presenter
```

Many terminal emulators may use a GPU internally, but that does not make Geordi
the renderer. Bijou supplies terminal protocol bytes; the emulator selects its
own font, glyph cache, rasterizer, GPU pipeline, and presentation timing.

### Current Geordi Native Presentation

Geordi currently proves native software rendering for bounded features. Its
native Rust architecture leaves `winit + wgpu` as a planned stronger endpoint.
No current Geordi crate consumes `packed-bijou-cells/1` or owns a native Bijou
cell host.

## Terminology And Claim Discipline

This design uses four separate claims.

| Claim | Meaning | First-slice status |
| :--- | :--- | :--- |
| GPU-presented cells | GPU rasterizes CPU-authored Bijou cells into the native target | proposed proof |
| GPU-produced cells | GPU compute or shader logic selects cell values before presentation | later proof |
| GPU-rendered terminal graphics | pixels are transmitted to a graphics-protocol terminal, which presents them | optional separate target |
| GPU-rendered generic TTY | arbitrary terminal accepts Geordi GPU or cell buffers directly | unsupported claim |

“True GPU rendering” is acceptable only when the receipt identifies which of
these claims was proved. A native window using `wgpu` can prove GPU presentation.
A compute pass plus presentation can prove GPU production and presentation. An
ANSI path cannot inherit either claim merely because the terminal emulator may
use a GPU.

## Ownership Boundaries

| Authority | Owns | Does not own |
| :--- | :--- | :--- |
| Bijou | cell meaning, canonical bytes, `Surface`, layout, focus, commands, input semantics, lower modes, accessibility intent | GPU buffer layout, shader dispatch, swapchain, glyph atlas implementation |
| Geordi | endpoint profile, validation mirror, GPU preparation, font-pack and glyph evidence, shaders, draw submission, probes, render receipt | component meaning, application state, terminal key-routing policy |
| Native host adapter | window/surface lifecycle, pixel density, resize facts, input-event translation, presentation timing | Bijou command meaning or Geordi artifact law |
| Generic terminal adapter | ANSI and terminal protocol bytes | GPU presentation claim |
| Graphics-protocol adapter | raster transmission, placement, acknowledgement, fallback | packed-cell ABI or zero-readback GPU sharing |
| Terminal emulator integration | any terminal-specific shared-cell or renderer plugin contract | portable behavior unless independently standardized and proved |

The authority chain is:

```text
Bijou cell semantics
  -> canonical packed-bijou-cells/1
    -> Geordi native-cell endpoint preparation
      -> target-owned GPU buffers and assets
        -> native host presentation
          -> endpoint receipt
```

The target-preparation layer may not normalize malformed canonical input or
silently reinterpret terminal-default colors, modifiers, grapheme identity,
scene ownership, or focus.

## Endpoint Model

The first endpoint profile should be named independently of the canonical cell
format. Illustrative identifiers are:

```text
source contract:
  packed-bijou-cells/1
  bijou-packed-cell-u8x10-le/1

endpoint profile:
  geordi-native-bijou-cells/1

prepared GPU layout:
  geordi-gpu-bijou-cell-instance-u32x4/1

glyph profile:
  geordi-bijou-cell-glyph-run/1

receipt:
  geordi-native-bijou-cells-receipt/1
```

The exact identifiers remain provisional until the Geordi implementation cycle
owns them. This Bijou design fixes the authority model, not Geordi package names.

## Why The Ten-Byte Format Is Not The GPU ABI

`bijou-packed-cell-u8x10-le/1` is compact and well suited to canonical receipts,
CPU storage, hashing, and terminal diffing. It is deliberately byte-oriented.

GPU host-shareable structures have target layout and alignment requirements.
Exposing the ten-byte record directly as a WGSL struct would couple Bijou's
portable cell semantics to one shader-language layout and encourage unsafe
unaligned or backend-specific interpretation.

Geordi should instead prepare a target-owned aligned record. One illustrative
layout is four unsigned 32-bit words:

```typescript
interface PreparedGpuCellInstance {
  readonly glyphRunIndex: number;
  readonly foregroundRgba8: number;
  readonly backgroundRgba8: number;
  readonly flagsAndOpacity: number;
}
```

The grid position is derived from the instance index and declared width. The
presence bits remain authoritative for terminal-default colors; packed zero
channels must not silently become black. Modifier and opacity interpretation
must be profile-bound.

This 16-byte layout is endpoint preparation, not a new Bijou cell semantic
format. Its hash, version, and producer identity belong in the Geordi receipt.

## Glyph And Font Preparation

A cell's character value is not automatically a GPU glyph index.

Direct BMP values and grapheme side-table entries must pass through a declared
font and shaping profile:

```text
canonical character or side-table grapheme
  -> content-addressed font pack
    -> prepared one-cell glyph run
      -> glyph atlas and glyph-instance table
        -> cell glyphRunIndex
```

A single grapheme may require more than one positioned glyph. The prepared cell
record should therefore reference a glyph run rather than assuming one Unicode
value equals one atlas tile.

The first proof should use a deliberately small fixture and one committed font
pack. It may support only a bounded ASCII or single-glyph subset if unsupported
graphemes fail before GPU submission. It must not use host font fallback and
then claim deterministic output.

The native host's pixels are not expected to equal pixels from the user's
configured terminal font. The portable claim is cell identity and prepared
asset identity. Pixel claims are endpoint- and asset-relative.

## Render Passes

The initial renderer can remain simple:

1. validate the canonical receipt and target profile;
2. prepare cell instances and glyph runs on the CPU;
3. upload the complete small instance buffers;
4. draw background cell quads;
5. draw glyph quads from the declared atlas;
6. draw supported decoration passes such as underline;
7. render to an offscreen texture in CI or a `winit` swapchain locally;
8. evaluate declared probes and emit the endpoint receipt.

The first slice should upload the complete grid. Dirty-range optimization is
not required to prove the boundary.

## Buffer Economics

The cell buffer is intentionally small.

For an illustrative `160 x 48` grid:

```text
7,680 cells
76,800 canonical bytes at 10 bytes per cell
122,880 prepared bytes at 16 bytes per GPU instance
960 render-dirty bytes at one bit per cell
```

A complete 16-byte instance upload at 60 frames per second is approximately
`7.4 MB/s`; at 120 frames per second it is approximately `14.7 MB/s`. These are
arithmetic illustrations, not measured performance claims.

The existing receipt maximum of `100,000` cells yields `1,000,000` canonical
bytes and `1,600,000` bytes under the illustrative prepared layout. The first
proof should use a normal terminal-sized grid and measure before introducing
partial uploads, persistent mapping, shared memory, or a ring buffer.

## Live Frame Boundary

`packed-bijou-cells/1` is a complete JSON-shaped receipt, not a live streaming
protocol. The first proof should consume a checked fixture.

A later native host may consume live Bijou `PackedSurface` snapshots through an
explicit adapter:

```text
PackedSurface
  dimensions
  buffer
  sideTable
  renderDirtyWords
  frame identity
    -> native-host adapter
      -> validated frame snapshot
        -> Geordi preparation and upload
```

The live adapter must not silently turn the receipt format into a mutable shared
ABI. If cross-process or cross-language transport is required, it needs a
separate versioned frame or delta contract, capacity limits, ordering law, and
backpressure policy.

Potential transports such as N-API, WASM memory, shared memory, or a ring buffer
remain implementation choices. None is part of the first proof.

## GPU Presentation Versus GPU Cell Production

### Slice A: GPU Presentation

```text
Bijou CPU view and lowering
  -> canonical cell values
    -> Geordi CPU preparation
      -> GPU instance buffers
        -> GPU raster and presentation
```

This proves a native GPU terminal-grid renderer. It retains CPU authority for
cell meaning and glyph resolution.

### Slice B: GPU Cell Production

```text
declared visual scene or effect
  -> Geordi compute/shader pipeline
    -> prepared GPU cell buffer
      -> GPU cell-grid presentation
        -> optional compact cell readback and receipt
```

This later slice is useful for fluid fields, particles, ray tracing, raster-to-
glyph fitting, and other visual-only regions. It must prove equivalence to a
named CPU reference or carry explicit backend-relative residuals.

GPU-produced cells must not become the authority for focus, commands,
accessibility, localization, or ordinary product controls. A Bijou application
may compose a GPU-produced visual region into a larger semantic interface.

## Terminal Host Matrix

| Host | Data delivered | Final rasterizer | Honest claim |
| :--- | :--- | :--- | :--- |
| Generic TTY | UTF-8 and terminal control sequences | terminal emulator | ordinary Bijou terminal rendering |
| Graphics-protocol terminal | RGB/RGBA/PNG raster data and placement commands | terminal emulator | raster graphics shown in a terminal |
| Geordi native cell window | prepared cells, glyph runs, atlas, GPU commands | Geordi native endpoint | native GPU presentation of Bijou cell semantics |
| Terminal-emulator plugin | plugin-defined cells or GPU resources | integrated terminal renderer | terminal-specific GPU cell integration |

The native cell window is the smallest path that makes Geordi responsible for
the final GPU raster without first expanding the grid into a CPU RGBA frame.
It is terminal-grid UI, but it is not a generic TTY or a complete terminal
emulator.

The first proof does not implement a shell, PTY, scrollback, escape parser,
multiplexer, or arbitrary terminal application hosting.

## Input And Runtime Boundary

The render-only fixture proof has no live input.

A later interactive host should route native events through an adapter:

```text
winit keyboard, pointer, resize, and close events
  -> Bijou host input adapter
    -> Bijou messages and commands
      -> update
        -> view
          -> next cell frame
```

Geordi must not create a second focus graph or component state model. Pointer
hover may exist only when the host declares pointer capability. Resize facts
must enter Bijou's layout boundary rather than scaling an old cell grid and
pretending the layout was recomputed.

## Capability And Refusal Contract

The endpoint profile must declare at least:

- accepted receipt and cell-format versions;
- maximum dimensions and cell count;
- supported chroma and opacity policies;
- supported modifier and decoration bits;
- supported glyph and font profile;
- supported scene and focus evidence posture;
- backend and adapter identity;
- offscreen and windowed presentation support;
- probe policy;
- accessibility posture;
- unsupported-feature behavior.

Validation must finish before buffer allocation or draw submission. Unsupported
glyphs, modifiers, chroma, dimensions, or target requirements fail loudly. The
renderer must not replace an unsupported grapheme with a space, drop a modifier,
coerce terminal-default color to black, or truncate the grid and still emit a
success receipt.

## Receipt Contract

An illustrative endpoint receipt is:

```typescript
interface GeordiNativeBijouCellsReceipt {
  readonly receiptVersion: 'geordi-native-bijou-cells-receipt/1';
  readonly input: {
    readonly packedReceiptVersion: 'packed-bijou-cells/1';
    readonly cellFormatId: 'bijou-packed-cell-u8x10-le/1';
    readonly sceneHash: string;
    readonly cellBytesHash: string;
    readonly sideTableHash: string;
  };
  readonly preparation: {
    readonly profileId: string;
    readonly preparedLayoutId: string;
    readonly preparedBufferHash: string;
    readonly glyphRunHash: string;
    readonly glyphAtlasHash: string;
    readonly fontPackHash: string;
    readonly shaderBundleHash: string;
  };
  readonly endpoint: {
    readonly profileId: 'geordi-native-bijou-cells/1';
    readonly rendererId: string;
    readonly adapterId: string;
    readonly backend: string;
    readonly presentation: 'offscreen' | 'native-window';
    readonly cellProduction: 'cpu-reference' | 'gpu';
  };
  readonly output: {
    readonly widthPixels: number;
    readonly heightPixels: number;
    readonly probePolicyHash: string;
    readonly probeResultsHash: string;
    readonly frameHash?: string;
  };
  readonly claims: readonly string[];
  readonly nonclaims: readonly string[];
}
```

The exact GPU adapter and device description may be useful diagnostic facts but
must not become a stable semantic identifier unless the target profile says so.
No timestamps, host paths, process identifiers, window handles, mutable GPU
objects, or ambient driver state belong in canonical receipt identity.

## Determinism And Proof Posture

The portable proof should prioritize:

- input and prepared-buffer hashes;
- exact feature-profile validation;
- font, glyph, atlas, and shader asset identity;
- deterministic CPU preparation;
- endpoint-scoped probes;
- explicit backend and adapter identity;
- explicit claims and nonclaims.

Universal pixel identity across Metal, Vulkan, Direct3D, browser WebGPU, and all
drivers is not the first claim. Exact probes may be asserted inside a pinned
backend and adapter posture. Cross-backend proofs should begin with structural
preparation parity and bounded tolerant or coarse probes, then strengthen only
when the evidence supports a stronger statement.

The CPU reference remains semantic truth for GPU cell production. A faster GPU
result does not redefine the glyph, color, coverage, or fitting law.

## Accessibility And Assistive Posture

A GPU cell grid is visual output, not an accessibility tree.

The native host must eventually expose or pair with Bijou's semantic node,
accessible name, role, focus, and command facts through a host accessibility
adapter. Pixels and cell bytes alone cannot support a screen reader.

The first render-only proof makes no accessibility claim beyond preserving the
scene and focus identities present in the input receipt. The ordinary
accessible, static, pipe, and ANSI paths remain available and must not depend on
the GPU endpoint.

No essential state may be communicated only through color, animation, shader
effects, or cell position. Reduced-motion and frozen-frame policies belong in
the application and target profile.

## Localization And Directionality Posture

The native renderer consumes already resolved one-cell graphemes. It does not
perform locale selection, bidirectional reordering, line wrapping, wide-cell
layout, or application text fallback.

The first profile may support only a bounded glyph set under a committed font
pack. Unsupported localized glyphs must refuse the GPU endpoint before drawing,
while the ordinary terminal and accessible modes remain usable.

A mature profile may use Geordi's prepared glyph-run and font evidence, but it
must preserve Bijou's layout and localization authority rather than reshaping
text into a different cell geometry.

## Graceful Degradation

The GPU endpoint is additive:

```text
native GPU host available and supported
  -> Geordi native cell presentation

otherwise interactive TTY available
  -> existing Bijou ANSI endpoint

otherwise static or pipe posture
  -> existing semantic lowering
```

No core Block, Component, theme, interaction recipe, or application command may
require the GPU host. GPU-only visual regions need a declared fallback Surface,
static witness, or explicit obstruction.

## Security And Resource Posture

The consumer must validate before allocating GPU resources:

- exact object and version shape;
- safe positive dimensions;
- cell-count and byte-count limits;
- canonical bytes and side-table references;
- bounded glyph-run and atlas expansion;
- content-addressed font and shader assets;
- declared output dimensions and pixel-density policy;
- no absolute host paths or ambient font discovery;
- no caller-provided shader source in the first profile.

The existing `100,000`-cell receipt limit is an input ceiling, not an automatic
promise that every native endpoint will accept that many cells. The endpoint may
declare a smaller limit and must refuse larger inputs deterministically.

## Agent Inspectability And Explainability Posture

An agent should be able to inspect:

- original receipt identity and exact cell bytes;
- cell and side-table counts;
- source scene and per-cell ownership;
- target feature profile;
- unsupported requirements;
- prepared cell and glyph-run records;
- font, atlas, and shader identities;
- adapter, backend, and presentation posture;
- CPU-authored versus GPU-authored cell posture;
- probe inputs and results;
- explicit claims and nonclaims.

The agent must not need a native window, screenshot OCR, GPU debugger, hidden
registry, terminal emulator configuration, or host font lookup to answer those
questions.

## Linked Invariants

- Bijou owns cell semantics; Geordi owns endpoint rendering.
- Canonical input is validated before target preparation.
- `packed-bijou-cells/1` is not a mutable GPU ABI.
- Target-prepared buffers do not redefine canonical cell identity.
- Unsupported features fail before allocation or drawing.
- GPU output does not become semantic truth.
- A native GPU window is not described as a generic TTY.
- A raster terminal graphics protocol is not described as zero-copy cell
  presentation.
- Pixels do not replace accessibility semantics.
- The ordinary terminal, static, pipe, and accessible postures remain available.

## Scope

This design-only cycle includes:

- the cross-repository evidence audit;
- the host and claim taxonomy;
- the canonical-versus-prepared buffer boundary;
- ownership, capability, receipt, accessibility, localization, and degradation
  contracts;
- a fixture-first implementation plan for later V10 work;
- tests and acceptance criteria for the first executable proof.

## Non-Goals

This cycle does not:

- add a Geordi dependency to Bijou;
- change `Surface`, `PackedSurface`, the terminal differ, or the packed-cell
  formats;
- implement a Rust, N-API, WASM, WebGPU, Metal, Vulkan, or `wgpu` runtime;
- implement a terminal emulator, PTY, shell, escape parser, scrollback buffer,
  or multiplexer;
- implement a kitty, Sixel, iTerm2, or other graphics-protocol adapter;
- claim that an arbitrary TTY accepts a GPU buffer;
- make a native window the default Bijou host;
- implement GPU cell production;
- migrate DOGFOOD or the title screen;
- claim pixel identity with an ordinary terminal emulator;
- change accessibility or localization behavior;
- move V10 renderer work ahead of V8 and V9 release gates.

## Implementation Slices

### Slice 0: Contract And Fixture Intake

1. Copy one byte-identical `packed-bijou-cells/1` fixture into the Geordi
   conformance corpus with the originating Bijou revision and digests.
2. Implement a strict Rust boundary validator or generated DTO that rejects
   unsupported versions and malformed relationships.
3. Emit an input-validation receipt before any renderer exists.

### Slice 1: CPU Preparation Reference

1. Define the endpoint profile and prepared buffer identifiers.
2. Pin one small font pack and bounded glyph policy.
3. Convert canonical cells into deterministic aligned instances and glyph runs.
4. Hash and inspect the prepared artifacts.
5. Refuse unsupported glyphs, modifiers, and chroma before drawing.

### Slice 2: Offscreen Native GPU Presentation

1. Add a conservatively named Geordi Rust crate whose implementation actually
   uses `wgpu`.
2. Render backgrounds, glyphs, and the supported decoration subset into an
   offscreen texture.
3. Run declared pixel probes.
4. Emit a native endpoint receipt.
5. Run the proof in CI without a desktop window.

### Slice 3: Windowed Host Proof

1. Present the same prepared artifacts through a `winit` swapchain.
2. Record resize, pixel-density, adapter, and presentation facts.
3. Keep input disabled or fixture-driven until the render boundary is proven.

### Slice 4: Live Bijou Host Adapter

1. Define a bounded frame-snapshot boundary from a live `PackedSurface`.
2. Route `winit` input and resize events through Bijou-owned adapters.
3. Measure full-buffer uploads before adding dirty spans or shared memory.
4. Preserve the ordinary ANSI endpoint unchanged.

### Slice 5: GPU Cell Production

1. Select one visual-only deterministic kernel with a CPU reference.
2. Produce prepared cells in a GPU compute pass.
3. Feed the result directly into the presentation pass.
4. Read back only the compact cell buffer or declared probes when evidence
   requires it.
5. Compare against the CPU reference under an explicit precision policy.

Graphics-protocol terminals and terminal-emulator integrations are separate
future endpoint stories. They must not be smuggled into these slices as an
implementation detail.

## Tests To Write First

1. The checked Bijou fixture validates and retains exact dimensions, bytes,
   side-table order, scene ownership, focus, and chroma.
2. Unknown receipt, cell, prepared-layout, glyph, and endpoint versions fail
   before GPU allocation.
3. CPU preparation maps every canonical cell to one prepared cell instance and
   every visible grapheme to one declared prepared glyph run.
4. Repeated preparation produces byte-identical prepared artifacts and hashes.
5. Terminal-default foreground and background presence bits survive preparation
   without becoming black.
6. Unsupported side-table graphemes, modifiers, opacity, chroma, and dimensions
   produce typed deterministic refusal.
7. The offscreen renderer consumes the same prepared artifacts as the windowed
   renderer.
8. Declared probes pass for one pinned adapter/backend posture and report exact
   expected and actual facts on failure.
9. The endpoint receipt binds input, preparation, assets, shaders, adapter,
   presentation, probes, claims, and nonclaims.
10. The receipt distinguishes `cpu-reference` from `gpu` cell production.
11. No test calls host font lookup or platform text APIs in the compliant path.
12. The Bijou ANSI render path and packed-cell adapter tests remain unchanged
   and green.
13. A headless environment can run the validation and offscreen proof or emits
   a typed capability obstruction rather than silently falling back to software
   while retaining a GPU claim.

## Validation Plan

This design-only cycle validates documentation and repository state:

```bash
npm run docs:inventory
git diff --check
```

The later cross-repository implementation should add commands equivalent to:

```text
npx vitest run tests/cycles/RE-036
cargo test -p geordi-bijou-cells
cargo run -p geordi-native-bijou-cells -- --smoke <fixture>
```

The command and crate names are illustrative until the Geordi cycle owns them.
Executable fixtures and receipts, not this design record, will prove the GPU
path.

## Acceptance Criteria

- The design identifies implemented, proposed, historical, and speculative
  evidence separately.
- The design distinguishes generic TTY, graphics-protocol terminal, native
  cell window, and terminal-emulator integration.
- The design distinguishes GPU presentation from GPU cell production.
- `packed-bijou-cells/1` and its ten-byte cell format remain Bijou-owned and
  unchanged.
- Any GPU-aligned layout is target-prepared, explicitly versioned, and bound in
  the Geordi receipt.
- The first executable proof uses one small checked fixture and a committed
  font/glyph profile.
- Unsupported input fails before GPU allocation or drawing.
- The first GPU proof runs offscreen in CI and can also present through a native
  window without changing prepared artifacts.
- Claims remain endpoint-relative and do not imply generic terminal, universal
  backend, or terminal-font pixel parity.
- Input, focus, commands, accessibility, localization, and lower-mode authority
  remain in Bijou.
- The ordinary ANSI, static, pipe, no-color, and accessible postures do not
  depend on Geordi or a GPU.
- GPU cell production remains a later equivalence proof against a CPU reference.
- The implementation stays in the V10 renderer and host horizon.

## Risks

### Risk: A Native Window Is Marketed As A Terminal

A cell-grid window can look like a terminal without implementing terminal
protocol, PTY, shell, scrollback, or arbitrary terminal applications.

Mitigation: call the first endpoint a native Bijou cell host. Claim terminal-
grid semantics, not terminal-emulator compatibility.

### Risk: The Canonical Cell Format Becomes A GPU ABI

Direct shader interpretation of the ten-byte format would bind Bijou semantics
to backend alignment and layout rules.

Mitigation: preserve the canonical bytes and derive a separately versioned,
hashed, endpoint-owned prepared layout.

### Risk: GPU Speed Becomes Correctness

A visually plausible shader result can drift from the CPU cell and glyph laws.

Mitigation: retain CPU preparation and CPU cell-production references. Require
explicit equivalence evidence before a GPU-produced path gains the same claim.

### Risk: Font Rendering Erases Cell Identity

Host font fallback, shaping, and rasterization can turn identical character
values into different pixels or widths.

Mitigation: use content-addressed font and prepared glyph evidence, refuse
unsupported graphemes, and keep pixel claims endpoint-relative.

### Risk: A Graphics Protocol Is Mistaken For Zero Copy

Shared-memory raster transfer can avoid base64 copies while still requiring a
pixel buffer and terminal-owned import.

Mitigation: classify it as a raster graphics endpoint, not packed-cell or shared
GPU-buffer presentation.

### Risk: Dual Runtime Authority

A native host could create its own focus, input, resize, or component-state
rules.

Mitigation: adapt host events into Bijou messages and recompute the Bijou view.
Geordi consumes frames and never owns application state.

### Risk: Premature Streaming Complexity

Dirty spans, N-API, shared memory, ring buffers, and backpressure can overwhelm
the proof before full-buffer upload has been measured.

Mitigation: begin with a full upload of one small fixture and one offscreen
renderer. Optimize only from measured evidence.

### Risk: GPU Availability Breaks Bijou's Degradation Contract

A GPU-only product path would fail over SSH, CI, pipes, constrained terminals,
or assistive environments.

Mitigation: keep the endpoint additive and require existing ANSI, static, pipe,
no-color, and accessible lowerings to remain complete.

## Open Questions

1. Should the first Geordi consumer validate the JSON receipt independently in
   Rust, consume a generated cross-language DTO, or accept a smaller binary
   fixture plus the canonical receipt?
2. Should prepared GPU records reference a glyph run, a glyph-instance range,
   or a bounded single-glyph atlas entry in version `1`?
3. Which modifiers belong in the first render profile: bold, dim, underline,
   inverse, strikethrough, or only foreground/background/glyph?
4. Should the native host rasterize terminal-default colors from an explicit
   host theme, and how is that theme identity bound into the receipt?
5. Which offscreen `wgpu` adapter posture can run reliably in hosted CI without
   turning software fallback into an accidental GPU claim?
6. Does the eventual live adapter belong in Bijou, Geordi, a small bridge
   package, or a native host application?
7. Is a future terminal-emulator integration valuable enough to justify a
   plugin/API proposal, or is the native Bijou host the complete product need?
8. Which visual-only DOGFOOD region is the first lawful GPU cell-production
   candidate after the renderer boundary is proved?

## Recommended Next Step

Do not start with a fluid shader, terminal emulator, zero-copy bridge, or full
DOGFOOD host. Start with the landed RE-036 fixture:

```text
one packed-bijou-cells/1 fixture
  -> strict Geordi Rust consumer
    -> deterministic CPU-prepared 16-byte cell instances
      -> one pinned font and bounded glyph profile
        -> wgpu offscreen render
          -> probes and receipt
```

That proof answers the foundational question: can Geordi become the actual
native GPU rasterizer for Bijou's small terminal-cell grid while keeping Bijou
semantics, generic terminal behavior, and degradation boundaries honest?

## Closeout Notes

Status: proposed design only. No native GPU endpoint, live host, Geordi consumer,
or terminal protocol changed in this cycle. Future executable work remains
assigned to the V10 renderer and host horizon.
