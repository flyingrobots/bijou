---
id: DL-022
title: Theme Lab Editor Graph UX
status: active
lane: asap
priority: high
github_issue: 450
legend: DL
---

# DL-022 - Theme Lab Editor Graph UX

Legend: [DL - Design Language](../legends/DL-design-language.md)

## Decision Summary

DL-019 and DL-020 made theme rule provenance inspectable, and DL-021 made the
DOGFOOD Theme Inspector prove that its chrome consumes active theme tokens. The
Theme Lab still reads like a static reference page. This cycle turns it into a
bounded editor surface with visible controls and a live token graph that updates
from the same in-memory draft theme when a color changes.

The runtime truth for this slice is:

```text
active DOGFOOD shell theme
  -> editable DOGFOOD-local draft
    -> selected editable color slot
      -> derived theme token rows
        -> live token relationship graph
```

No external design-token package or design-book dependency is added. The useful
idea is the relationship graph and immediate feedback loop, implemented through
Bijou's existing theme and terminal surface contracts.

## Sponsored Human

A DOGFOOD user opening `Themes` wants something that behaves like an editor,
not a read-only list. They need a focused color row, obvious keyboard controls,
a current hex value, and a graph that changes when the color changes.

## Sponsored Agent

An agent auditing theme behavior needs deterministic model functions and
scripted preview tests that prove a color edit updates the editor state,
rendered token values, and graph rows in the same frame.

## Hill

Theme Lab exposes a first editing pass for active DOGFOOD theme colors. A user
can move between editable colors, nudge RGB channels, reset the draft, and see a
live graph of token relationships and changed colors without leaving the docs
shell.

## Playback Questions

- Does the Theme Lab show editing affordances rather than only static swatches?
- Can the selected editable row move deterministically with keyboard input?
- Does changing a channel update the selected hex value and the rendered token
  graph in the same frame?
- Does reset restore the draft graph to the active theme values?
- Are all new visible labels catalog-backed?

## Scope

Included:

- a DOGFOOD-local theme draft model that clones the active shell theme
- editable rows for a bounded set of high-signal tokens
- deterministic key handling for selection, channel choice, nudging, and reset
- a live graph renderer that shows token nodes, dependency edges, and edited
  nodes from the current draft
- deterministic invalid-input handling: RGB channel nudges clamp to `0..255`,
  unsupported keys are ignored, and this first pass exposes no free-form hex
  parser that could accept malformed color text
- focused preview tests for editing state and graph updates
- changelog and DOGFOOD i18n catalog updates

Out of scope:

- saving custom themes to disk
- mutating exported preset constants
- importing or integrating design-book
- mouse or pointer editing
- full authoring for every third-party preset
- replacing `TokenGraph`, `Theme`, or the existing DOGFOOD shell theme model

## Runtime Contract

The editor state is owned by the DOGFOOD docs model. It is not a global theme
registry and it does not mutate `BIJOU_DARK`, `BIJOU_LIGHT`, or shell theme
constants.

The renderer must consume one draft object for all Theme Lab editor output:

- editor row swatches
- selected color hex
- channel values
- graph nodes
- graph edges
- palette preview rows

If a color changes, the graph changes because it is projected from the draft
theme, not because the graph keeps its own color cache.

This slice does not feed the draft into `ContextPort.tokenGraph` or replace the
runtime `TokenGraph` exposed by `ContextPort`. The docs shell still observes the
active runtime theme through the normal context path, while Theme Lab builds a
local presentation graph from the unsaved draft. That keeps third-party
`observeTheme()` guidance intact: unsaved editor previews are local to Theme
Lab, and any future persisted theme must re-enter the canonical context and
token-graph path.

## Editable Slots

The first pass edits a deliberately small set of active DOGFOOD runtime tokens:

- `semantic.primary`
- `semantic.accent`
- `surface.primary.bg`
- `surface.secondary.bg`
- `border.primary`
- `ui.cursor`
- `status.success`
- `status.error`

Those slots are enough to prove text, surface, border, cursor, and status
feedback without pretending this is a full theme persistence product.

## Graph Shape

The graph is textual and terminal-native. It should show:

- token path
- current hex or foreground/background pair
- edited marker when the draft differs from the active theme
- dependency-style edges for major families, such as:

```text
semantic.accent #7aa7e8 *
  -> border.secondary
  -> ui.cursor
  -> ui.focusGutter
surface.primary.bg #171827
  -> surface.primary
  -> ui.focusGutter.bg
```

`A -> B` means the preview treats `B` as a consumer or dependent of editable
source `A`. It does not mean runtime derivation has been committed to
`ContextPort.tokenGraph`.

The graph is not renderer provenance. It explains theme-token relationships and
draft changes only.

## Lower Modes

Swatches are optional visual assistance. The selected row, current hex, RGB
channels, edited marker, graph node names, and graph edge labels remain visible
as text.

## Localization Posture

All new Theme Lab labels, control hints, and graph section headings are DOGFOOD
catalog keys in every supported runtime locale. Token paths and hex values are
developer identifiers and are not localized. English `dogfoodText` fallbacks are
permitted as developer scaffolding and runtime resilience only; generated
catalog entries for the new keys must still exist before merge.

## Tests To Write First

- a pure editor-model test proving selection, channel nudge, and reset behavior
- a graph projection test proving an edited token is marked and carries the new
  hex value
- a same-frame coherence test proving a channel nudge updates the selected hex
  and the rendered graph node from the same draft state
- a DOGFOOD preview test proving Theme Lab renders editor controls and the live
  graph after scripted key input

## Closeout Notes

Close this cycle when the focused Theme Lab tests, DOGFOOD i18n gates,
Code Dojo changed-file gates, lint, and relevant preview checks are green. The
PR summary should explicitly name the before/after behavior: static reference
page to editable color lab with live graph feedback.
