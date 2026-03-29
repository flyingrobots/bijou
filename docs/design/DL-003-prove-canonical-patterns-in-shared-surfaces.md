# DL-003 — Prove Canonical Patterns in Shared Surfaces

Legend: [DL — Design Language](/Users/james/git/bijou/docs/legends/DL-design-language.md)

## Why this cycle exists

DL-002 makes the pattern and block language explicit.

The next step should prove that those patterns are not just prose by applying them to more shared surfaces.

This cycle intentionally picks the smallest meaningful proving slice:

- shared collection rows outside preference lists
- canonical full-row selection treatment
- one-cell inset rhythm in rich TUI surfaces

The best first candidates are:

- `browsableListSurface()`
- `commandPaletteSurface()`

Both already represent canonical shared collection behavior. Both currently still lean too much on a glyph-only focus cue in the rich surface path.

## Scope of this cycle

This cycle intentionally covers:

- proving canonical selected-row background treatment in shared TUI surfaces
- proving one-cell inset rhythm in those same rich surfaces
- doing that in `browsableListSurface()` and `commandPaletteSurface()`

It does **not** include:

- notification-center polish
- drawer rhythm and inspector surfaces
- a general block runtime
- changing the lowering-friendly string paths just to match rich TUI ornament

## Human users

### Primary human user

A builder using Bijou collection surfaces in a rich TUI shell.

They need:

- focused rows to read as clearly selected
- collection surfaces to feel consistent with the now-canonical settings language
- more than a tiny leading glyph to understand current selection in dense shells

### Human hill

A builder can place a browsable list or command palette in a shell and get canonical selected-row treatment without hand-adding shell-local styling.

## Agent users

### Primary agent user

An agent reviewing or generating collection-style TUI surfaces.

It needs:

- explicit evidence that shared surfaces follow the documented selected-row treatment
- a reliable distinction between selected rows and active regions
- the ability to point at concrete shared-surface proof, not just doctrine prose

### Agent hill

An agent can verify that shared list-like surfaces now honor the design-language rules for selection and spacing instead of guessing from one-off shell examples.

## Human playback

1. A builder renders a browsable list in a rich TUI.
2. The focused row reads as a full selected row, not just a glyph.
3. The same builder renders a command palette.
4. The palette uses the same selection logic and inset rhythm, so the shell feels related instead of custom per surface.

## Agent playback

1. An agent opens the DL-003 cycle doc.
2. It can identify the proving surfaces for the canonical selection pattern.
3. It can run cycle tests and see concrete row-background and inset assertions for those surfaces.
4. It can point to the next backlog item for continuing the proof into drawer/notices territory.

## Linked invariants

- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)
- [Focus Owns Input](/Users/james/git/bijou/docs/invariants/focus-owns-input.md)
- [Visible Controls Are a Promise](/Users/james/git/bijou/docs/invariants/visible-controls-are-a-promise.md)
- [Graceful Lowering Preserves Meaning](/Users/james/git/bijou/docs/invariants/graceful-lowering-preserves-meaning.md)

## Invariants for this cycle

- selected rows in rich TUI surfaces should use background fill, not only a glyph
- active-region treatment remains distinct from selected-row treatment
- one-cell inset rhythm should improve readability without obscuring core content
- lowering-friendly string paths should remain simpler unless the semantic contract requires more

## Implementation outline

1. Move DL-003 into the active cycle area and enrich it with playbacks and invariants.
2. Write failing cycle tests that prove selected-row background fill and inset rhythm in shared surfaces.
3. Update `browsableListSurface()` and `commandPaletteSurface()` to honor the canonical selected-row pattern.
4. Add package-local regression coverage.
5. Close the cycle with the next backlog item for drawer/notices follow-through.

## Tests to write first

Under `tests/cycles/DL-003/`:

- the active cycle doc includes the required workflow sections
- `browsableListSurface()` uses a full selected-row background and one-cell inset
- `commandPaletteSurface()` uses a full selected-row background and one-cell inset
- the next design-language backlog item exists

## Risks

- changing the lowering-friendly text path when only the surface path needs the richer treatment
- conflating active-region styling with selected-row styling
- introducing bespoke helper logic that is harder to reuse than the surfaces it is meant to unify

## Out of scope

- drawer and inspector rhythm
- notification rows
- future block promotion

## Retrospective

### What landed

- `browsableListSurface()` now uses canonical full-row selected-row background treatment and one-cell inset rhythm in the rich surface path
- `commandPaletteSurface()` now uses the same selected-row and inset treatment for its search line and result rows
- package-local regressions now lock those behaviors in alongside the cycle-owned playback test

### Drift from ideal

No material drift.

This cycle intentionally proved the pattern language in two shared collection surfaces without trying to generalize the entire shell or create a new public collection-row component family yet.

### Debt spawned

Spawned:

- [DL-004 — Prove Drawer Rhythm and Notice Rows](/Users/james/git/bijou/docs/BACKLOG/DL-004-prove-drawer-rhythm-and-notice-rows.md)
