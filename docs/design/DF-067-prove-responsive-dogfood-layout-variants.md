---
title: DF-067 Prove Responsive DOGFOOD Layout Variants
legend: DF
lane: design
priority: high
keywords:
  - dogfood
  - responsive
  - layout
  - variants
  - resize
---

# DF-067 Prove Responsive DOGFOOD Layout Variants

## Framing

DOGFOOD already responds mechanically to terminal resize events: the runtime
updates viewport dimensions, the framed shell recomputes body geometry, and the
current grid primitives solve new integer rectangles.

That is not enough.

The current docs shell keeps fixed sidebars and asks the middle track to absorb
whatever space remains. That is valid geometry, but below useful widths it
turns the app into a technically present three-column surface whose content is
no longer the primary thing.

This cycle keeps the work DOGFOOD-scoped. It does not wait for the full RE-035
layout envelope runtime. It proves the editorial layer first: resize handling
is mechanical, responsive layout is editorial.

## Sponsored Users

- Readers opening DOGFOOD in small terminals.
- Maintainers validating layout doctrine against a real product surface.
- Agents checking whether DOGFOOD remains useful at constrained sizes instead
  of merely nonblank.

## Hills

1. At wide sizes, a reader sees navigation, content, and metadata/variant
   context together.
2. At standard sizes, a reader keeps navigation and content while secondary
   metadata folds away.
3. At narrow sizes, content becomes primary while navigation remains reachable.
4. At tiny sizes, DOGFOOD becomes a single useful pane instead of a crushed
   multi-column layout.

## Playback Questions

- Does DOGFOOD classify terminal size into explicit layout variants?
- Does `140x40` keep the wide three-region docs/product shape?
- Does `100x30` fold metadata while preserving navigation and content?
- Does `72x20` keep content primary and navigation reachable?
- Does `50x14` render a single useful pane with no fake sidebars?
- Do the guide pages and component explorer both obey the same variant policy?
- Does resize update the variant and viewport state without requiring a
  restart?

## Requirements

- Add a pure `resolveDocsLayoutVariant(columns, rows)` helper returning:
  `wide`, `standard`, `narrow`, or `tiny`.
- Store the current layout variant in DOGFOOD page models so framed page layout
  functions can select a layout tree without depending on render-time hacks.
- Keep current wide layouts intact.
- Fold guide metadata and component variants out of `standard` and `narrow`
  layouts.
- Use a smaller navigation track in `narrow`.
- Use one content pane in `tiny`.
- Keep resize synchronization responsible for the page model's variant and
  viewport heights.

## Acceptance Criteria

- `tests/cycles/DF-067/responsive-dogfood-layout-variants.test.ts` proves the
  cycle doc carries the modern playback sections.
- The test proves the variant resolver thresholds.
- The test renders guide pages at `140x40`, `100x30`, `72x20`, and `50x14`.
- The test renders the component explorer at `140x40`, `72x20`, and `50x14`.
- The test proves a live resize from wide to tiny updates the model and output.

## Implementation Outline

1. Add the DOGFOOD layout variant type and resolver.
2. Add `layoutVariant` to `DocsExplorerModel`.
3. Update DOGFOOD sync to recompute the variant from `FrameModel.columns` and
   `FrameModel.rows`.
4. Split guide and component page layout construction by variant.
5. Update DOGFOOD docs/legend notes with the responsive posture.

## Drift Check

This is not a replacement for RE-035.

DF-067 deliberately uses the current framed shell, grid, pane, and viewport
primitives. The goal is to create product pressure and executable evidence for
later runtime-engine responsive doctrine without expanding the runtime API
prematurely.

## Playback

- RED: DOGFOOD redrew on resize but kept fixed sidebars even when the terminal
  could no longer support them.
- GREEN: DOGFOOD selects explicit layout variants and preserves useful content
  at wide, standard, narrow, and tiny sizes.
- Guide pages now render nav/content/meta at `wide`, nav/content at
  `standard` and `narrow`, and content-only at `tiny`.
- The component explorer now renders family/story/variants at `wide`,
  family/story at `standard` and `narrow`, and story content only at `tiny`.
- Resize synchronization updates each page model's variant, visible pane focus,
  pane scroll map, and list viewport height.

## Retrospective

This closes the immediate product gap without expanding the runtime layout API.
The current grid/frame primitives are enough to prove the editorial rule:
constrained layouts should choose a useful surface, not preserve a wider shape
until it becomes unreadable.
