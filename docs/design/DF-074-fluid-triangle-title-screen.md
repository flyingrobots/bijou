---
title: DF-074 Fluid Triangle Title Screen
legend: DF
lane: cool-ideas
priority: medium
status: proposed
github_issue: 321
keywords:
  - dogfood
  - title-screen
  - fluid
  - geordi
  - gpu
  - glyphs
  - render-target
---

# DF-074 Fluid Triangle Title Screen

Legend: [DF - DOGFOOD](../legends/DF-dogfood.md)

## Linked Work

- GitHub Issue: #321
- Inspiration:
  <https://github.com/javierbyte/fluid-triangle>
- Prior title art:
  [DF-073 Raster To Glyph Title Art](./DF-073-raster-to-glyph-title-art.md)
- Portable rendering direction:
  [DX-042 Shared UI Scene IR And Bijou Render Target](./DX-042-shared-ui-scene-ir-and-bijou-render-target.md)
- Portable endpoint direction:
  [DX-043 Portable Bijou Blocks And Multi-Endpoint IR](./DX-043-portable-bijou-blocks-and-multi-endpoint-ir.md)
- Related renderer experiments:
  [RE-031 Raytrace Shader Kernel](./RE-031-raytrace-shader-kernel.md),
  [RE-032 Fit Cell Glyphs From Coverage](./RE-032-fit-cell-glyphs-from-coverage.md)

This document is a planning artifact. It does not claim a GPU renderer,
Geordi packed-cell target, browser endpoint, or new title screen implementation
already exists in this repository.

## Decision Summary

Bijou should design a future DOGFOOD title screen around a live fluid field
moving around a triangular obstacle, rendered as terminal glyphs. The immediate
Bijou work should define the title-scene contract, deterministic CPU fallback,
theme-token policy, and cell-level proof. The high-end renderer should be
Geordi-backed when the shared render pipeline is ready.

The intended long-term flow is:

```text
Fluid Title Scene Spec
  -> deterministic field state
    -> Bijou CPU glyph renderer
      -> Bijou Surface
        -> terminal

Fluid Title Scene Spec
  -> Geordi fluid/shader endpoint
    -> PackedBijouCells or image witness
      -> Bijou Surface or browser/image output
```

The goal is not to copy a browser demo into DOGFOOD. The goal is to turn the
idea into a Bijou-native release-title system with deterministic witnesses and
a future GPU render endpoint.

## Sponsored Human

A Bijou maintainer wants a memorable title screen that feels alive, branded,
and release-specific without making DOGFOOD startup flaky, slow, or impossible
to test.

## Sponsored Agent

An agent wants a deterministic scene description, frame inputs, glyph outputs,
and render receipts so it can explain title-screen pixels and terminal cells
without depending on screenshots or manual terminal observation.

## Hill

DOGFOOD can show a fluid triangle title screen where the fluid motion, glyph
density, color tokens, and input behavior are deterministic under test, while
the production renderer can later upgrade from a Bijou CPU path to a
Geordi-backed GPU path without changing the title scene's product contract.

## Inspiration Boundary

The reference project is useful because it combines:

- fluid-like motion
- a triangular obstacle
- ASCII rendering
- per-column character sequences
- a playful launch-screen posture

Bijou should borrow the interaction and rendering concept, not the browser
runtime assumptions.

The reference README states that its simulation code comes from Ten Minute
Physics and that the project is MIT licensed. If Bijou ports substantial code
from the reference or from the underlying Ten Minute Physics simulation, the
ported file must preserve the relevant MIT attribution and copyright notice.
The preferred first implementation is an original Bijou renderer inspired by
the concept.

## Title Concept

The title screen should feel like a fluid gate opening around a triangle:

```text
..............................................................................
....@@@@@###WWWW9876????abc;:+=-,._       _.,-=+:;cba????6789WWWW###@@@@@....
...@@@###WWW9876????abc;:+=-,._          /\          _.,-=+:;cba????6789W....
..@@###WW9876????abc;:+=-,._            /  \            _.,-=+:;cba????67....
..@###W9876????abc;:+=-,._             /    \             _.,-=+:;cba????....
..@@###WW9876????abc;:+=-,._           \    /           _.,-=+:;cba????67....
...@@@###WWW9876????abc;:+=-,._         \  /         _.,-=+:;cba????6789....
....@@@@@###WWWW9876????abc;:+=-,._      \/      _.,-=+:;cba????6789WWW....
..............................................................................

                                  BIJOU
                              Press [Enter]
```

The actual renderer should not draw this literal mockup. This is a spatial
intent sketch:

- fluid surrounds a central triangular collider
- density changes map to glyph ramps
- the BIJOU mark remains readable above or inside the field
- the Enter prompt remains clear and localized
- the perf HUD and quit controls keep their existing ownership

## Scene Model

The title should be modeled as data before it is rendered.

```ts
type FluidTitleSceneSpec = {
  id: 'dogfood.fluid-triangle-title';
  version: 1;
  seed: number;
  cols: number;
  rows: number;
  quality: 'low' | 'medium' | 'high' | 'auto';
  themeMode: 'dark' | 'light';
  triangle: {
    centerX: number;
    centerY: number;
    radius: number;
    rotation: number;
  };
  glyphRamps: readonly string[];
  titleKey: 'dogfood.title.bijou';
  promptKey: 'dogfood.title.pressEnter';
};
```

The scene spec owns intent. Renderers own lowering.

## Renderer Targets

### Bijou CPU Renderer

The first implementation should be a deterministic Bijou CPU renderer. It does
not need to be a full fluid solver. It needs to produce the right motion
language, stay bounded, and be testable.

Acceptable first algorithms:

- advected scalar density field
- curl-noise-like deterministic flow
- lightweight particle splat field
- simplified stable fluid pass

The CPU renderer should emit:

```text
FluidTitleSceneSpec + frame index
  -> FluidTitleFrame
    -> Surface
    -> FluidTitleReceipt
```

### Geordi GPU Renderer

The intended high-end path is Geordi-rendered:

```text
FluidTitleSceneSpec
  -> Geordi fluid/shader endpoint
    -> rgba image target
    -> PackedBijouCells target
    -> frame witness
```

The Geordi endpoint should be allowed to compute richer fluid motion, higher
resolution fields, better collider interaction, and image/video witnesses.
Bijou should consume its output through a declared target profile rather than
special-case a browser canvas.

### Low Mode

Low mode must remain useful without GPU support.

```text
seeded density wave
  -> glyph ramp
    -> token colors
      -> Surface
```

Low mode should be cheap enough for CI snapshots and slow terminals.

## Quality Modes

| Mode | Renderer | Purpose |
| --- | --- | --- |
| `low` | Bijou CPU density wave | CI, SSH, constrained terminals |
| `medium` | Bijou CPU particle or scalar field | default local terminal |
| `high` | Geordi GPU endpoint when available | release capture, browser/image witness |
| `auto` | runtime choice | best available mode under frame budget |

`auto` must degrade deterministically by recorded facts:

```json
{
  "requestedQuality": "auto",
  "selectedQuality": "medium",
  "reason": "geordi-endpoint-unavailable",
  "frameBudgetMs": 16
}
```

## Theme And Color Policy

The renderer must use theme tokens rather than raw title-screen colors.

Candidate tokens:

```text
title.fluid.bg
title.fluid.low
title.fluid.mid
title.fluid.high
title.triangle.edge
title.triangle.fill
title.logo.fg
title.prompt.fg
title.prompt.enter.fg
```

The glyph ramp and color ramp should be separate:

```text
density -> glyph
density -> token/color
```

This avoids the prior title-screen failure mode where a visual layer appeared
to set the wrong background because glyph, foreground, and background channels
were not explicit enough.

## Input Contract

The title screen must keep the current input discipline:

- `Enter` proceeds to DOGFOOD.
- Backtick toggles the normal shell perf HUD.
- `q` opens the normal quit confirmation.
- Theme or quality controls may remain title-owned only if documented.
- No other ordinary key should accidentally skip the title.

Future optional interactions can perturb the field:

- mouse move nudges velocity
- arrow keys shift the triangle
- terminal resize reseeds layout while preserving deterministic frame facts

Those interactions are not required for the first slice.

## Localization And Directionality

The visible title and prompt must be localization-backed strings. The fluid
field itself is visual and does not require localization, but lower modes
should expose the string keys.

RTL posture:

- The prompt should use the app's existing text direction rules.
- The fluid field can remain spatially symmetric.
- Per-column glyph ramps should not encode English-only words in default mode.

The reference project's per-column letter sequences are useful as a visual
trick, but a Bijou default should not rely on hidden English text in the fluid
field.

## Accessibility And Assistive Posture

The title screen must not be the only source of release information.

Required posture:

- prompt remains static enough to read
- low-motion mode can freeze or heavily slow the field
- status/lower-mode facts identify the release title
- perf HUD remains accessible from the title screen
- the screen does not flash at unsafe contrast/frequency patterns

## Agent Inspectability

Every deterministic render pass should be able to emit a receipt:

```json
{
  "sceneId": "dogfood.fluid-triangle-title",
  "frame": 120,
  "seed": 700,
  "renderer": "bijou-cpu-density",
  "quality": "medium",
  "triangle": { "centerX": 80, "centerY": 18, "radius": 9 },
  "glyphRampHash": "fnv1a32:...",
  "surfaceHash": "fnv1a32:...",
  "tokenRefs": [
    "title.fluid.low",
    "title.fluid.mid",
    "title.fluid.high",
    "title.prompt.enter.fg"
  ]
}
```

For Geordi output, the receipt should add endpoint facts:

```json
{
  "renderer": "geordi-fluid-gpu",
  "endpoint": "packed-bijou-cells",
  "shaderHash": "sha256:...",
  "packedCellsHash": "fnv1a32:...",
  "witnessHash": "sha256:..."
}
```

## Playback Questions

1. Does the first frame read as Bijou before animation is observed?
2. Does `Enter` remain the only key that proceeds to DOGFOOD?
3. Does the prompt stay legible at 80x24 and larger terminals?
4. Can the title run in low mode without Geordi?
5. Can a test prove the triangle collider leaves a stable void or edge?
6. Can a receipt explain the selected renderer, quality, seed, tokens, and
   output hash?
7. Can the Geordi endpoint later replace the high-quality renderer without
   changing title-screen input behavior?

## Implementation Outline

1. Add the scene spec and receipt types.
2. Add a deterministic CPU low-mode density renderer.
3. Add glyph-ramp and theme-token lowering into `Surface`.
4. Add title-screen integration behind a release-title switch.
5. Preserve existing perf HUD, quit, and Enter-only routing contracts.
6. Add a low-motion/frozen frame path.
7. Add tests for frame determinism, prompt visibility, key routing, and token
   use.
8. Add Geordi endpoint target profile once packed-cell or image witness support
   is ready.

## Tests To Write First

- Given the same spec, seed, size, and frame, the CPU renderer produces the
  same `surfaceHash`.
- Given different frame indexes, at least one fluid-region cell changes while
  the prompt remains stable.
- Given 80x24, the prompt and title are visible and not overwritten by fluid
  cells.
- Given non-Enter printable key input, DOGFOOD remains on the title route.
- Given `Enter`, DOGFOOD proceeds to the main docs route.
- Given backtick, the normal perf HUD toggles while the title route remains
  active.
- Given low-motion mode, repeated frames produce either identical output or a
  documented bounded change.
- Given missing Geordi endpoint, `auto` selects a Bijou CPU renderer and emits
  a reason fact.

## Non-Goals

- No browser canvas dependency in DOGFOOD startup.
- No required GPU path for CI.
- No direct code port from the reference project in the design slice.
- No change to the public title-screen skip contract beyond preserving
  Enter-only proceed.
- No claim that this implements shared UI scene IR.

## Slice Plan

| Slice | Outcome | Proof |
| ---: | --- | --- |
| 1 | Design doc and issue | docs inventory |
| 2 | Scene spec and receipt types | type tests |
| 3 | Deterministic low-mode renderer | surface hash tests |
| 4 | DOGFOOD title integration | docs-preview tests |
| 5 | Input contract preservation | key routing tests |
| 6 | Theme-token color ramp | token receipt tests |
| 7 | Low-motion/frozen path | deterministic frame tests |
| 8 | Geordi endpoint design handoff | companion issue/doc |

## Closeout Notes

Open. This design should be closed only after the title screen either ships or
is deliberately superseded by a different release-title direction.
