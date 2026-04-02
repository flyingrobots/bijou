# DL-006 — Prove Inspector Panel Rhythm

Legend: [DL — Design Language](../legends/DL-design-language.md)

## Why this cycle exists

DL-005 proved the guided-flow side of the design-language follow-on through a canonical `explainability()` surface.

The inspector side is still waiting:

- side panels with current-value emphasis
- compact titled sections
- calm supporting-copy hierarchy
- one obvious relationship between the main task and the side context

This cycle exists to prove that rhythm through one canonical `inspector()` component instead of hiding it inside a DOGFOOD-specific box.

## Scope of this cycle

This cycle intentionally covers:

- one canonical `inspector()` component in `@flyingrobots/bijou`
- current-selection emphasis as part of the component instead of ad hoc pane copy
- compact titled sections with calmer supporting-copy hierarchy
- graceful lowering into pipe and accessible modes
- one real proving seam in DOGFOOD's variants pane

It does **not** include:

- a generalized inspector block runtime
- shell notification-center redesign
- settings-drawer changes
- localization or bidirectionality work beyond preserving meaning in lowering

## Human users

### Primary human user

A builder using a narrow side panel to understand the currently selected thing without losing sight of the main task.

They need:

- one obvious current selection
- compact sections instead of a prose blob
- supporting information that stays visually secondary
- a side panel that clarifies context instead of competing with the main pane

### Human hill

A user can glance at a side panel and understand what is selected, what supporting context matters, and how that context relates to the main task without reading a wall of prose.

## Agent users

### Primary agent user

An agent generating or auditing side-panel detail surfaces in Bijou.

It needs:

- one canonical inspector surface to target
- explicit current-value and section structure
- proof that inspector-panel rhythm is part of the design language instead of a one-off DOGFOOD treatment

### Agent hill

An agent can point to one reusable `inspector()` component and show that Bijou's inspector-panel language is executable code and tests rather than only prose.

## Human playback

1. A user selects a component story in DOGFOOD.
2. The variants side pane shows the currently selected variant clearly.
3. Supporting context appears in compact titled sections instead of one unstructured text block.
4. The active value is easier to scan than the supporting description.
5. The side panel feels supplemental and calm rather than louder than the main docs pane.

## Agent playback

1. An agent opens the DL-006 cycle doc.
2. It can identify the canonical proving seam as `inspector()` plus the DOGFOOD variants pane.
3. It can run cycle and package tests and see explicit assertions for current-selection emphasis, titled sections, and graceful lowering.
4. It can point to the next backlog item for inspector-panel follow-on work.

## Linked invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Visible Controls Are a Promise](../invariants/visible-controls-are-a-promise.md)
- [Graceful Lowering Preserves Meaning](../invariants/graceful-lowering-preserves-meaning.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)

## Invariants for this cycle

- inspector surfaces must make the current selection more obvious than supporting copy
- supporting sections must stay structured instead of collapsing into a text blob
- the side panel must clarify context without pretending to own the primary task
- pipe and accessible modes must preserve the same fields without relying on borders or color
- this cycle must prove one canonical inspector surface before promoting a generalized inspector block

## Implementation outline

1. Move DL-006 into the active cycle area and enrich it with playbacks and invariants.
2. Write failing cycle tests for a canonical `inspector()` surface and the DOGFOOD proving seam.
3. Implement `inspector()` in `@flyingrobots/bijou`.
4. Export it through the canonical component barrels.
5. Replace the bespoke DOGFOOD variants detail box with the canonical inspector surface.
6. Close the cycle and spawn the next inspector follow-on backlog item.

## Tests to write first

Under `tests/cycles/DL-006/`:

- the active cycle doc includes the required workflow sections
- `inspector()` preserves current selection and titled sections in pipe mode
- accessible lowering preserves the same fields explicitly
- DOGFOOD variants pane renders current selection through the inspector language
- the next design-language backlog item exists

## Risks

- making the component too generic too early
- letting inspector surfaces become decorative boxes instead of calm contextual panels
- overfitting the component to DOGFOOD without proving reusable structure

## Out of scope

- generalized block promotion
- notification-center reuse
- bidirectional panel mirroring
- richer shell inspector routing

## Retrospective

### What landed

- a new canonical `inspector()` component in `@flyingrobots/bijou`
- explicit current-selection emphasis as part of the component instead of a DOGFOOD-specific box
- compact titled sections with calmer supporting-copy hierarchy
- DOGFOOD's variants side pane now proves the inspector language through a real product seam
- cycle and package tests that make inspector-panel rhythm executable instead of only descriptive

### Drift from ideal

This cycle did not promote a generalized inspector block runtime.

That was intentional and correct.

The right proof step was one reusable component plus one real product seam, not a larger block abstraction before reuse and ownership are clearer.

### Debt spawned

Spawned:

- [DL-007 — Promote Inspector Panel Block](../BACKLOG/DL-007-promote-inspector-panel-block.md)
