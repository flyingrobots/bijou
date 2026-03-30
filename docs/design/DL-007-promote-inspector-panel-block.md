# DL-007 — Promote Inspector Panel Block

Legend: [DL — Design Language](/Users/james/git/bijou/docs/legends/DL-design-language.md)

## Why this cycle exists

DL-006 proved the first canonical inspector seam through `inspector()` and the DOGFOOD variants pane.

That gave Bijou a reusable component, but not yet a reusable block.

The design-system block acceptance bar says a structure is ready to become a block when:

- it recurs across more than one surface or product need
- its interaction ownership is stable
- its patterns are already canonical elsewhere
- its lowering story is explicit

This cycle exists to clear that next bar by promoting inspector language into a reusable TUI block helper instead of leaving two drawer-based inspector surfaces to keep hand-composing strings.

## Scope of this cycle

This cycle intentionally covers:

- one reusable `inspectorDrawer()` block helper in `@flyingrobots/bijou-tui`
- one refinement to `inspector()` so block composition does not require nested decorative chrome
- proving the block in two existing inspector-drawer examples
- clear separation between core inspector content semantics and TUI block ownership

It does **not** include:

- a generalized shell inspector runtime
- inspector state management beyond what the host app already owns
- notification-center adoption
- guided-flow block promotion

## Human users

### Primary human user

A builder composing shell-attached supplemental context next to an existing primary task.

They need:

- a reusable inspector drawer that already feels calm and structured
- one obvious current selection
- stable drawer ownership instead of inventing new overlay conventions
- no nested-box visual noise

### Human hill

A builder can attach a supplemental inspector drawer to a shell surface and get calm current-selection emphasis plus compact titled sections without hand-drawing another ad hoc panel.

## Agent users

### Primary agent user

An agent generating or auditing drawer-attached contextual side panels in Bijou.

It needs:

- one block-level helper to target instead of reconstructing drawer + inspector composition
- explicit proof that inspector language now recurs across more than one real surface
- clear boundaries between core component semantics and TUI block ownership

### Agent hill

An agent can point to one canonical `inspectorDrawer()` helper, prove it in two example surfaces, and explain what belongs to the core `inspector()` component versus the block helper.

## Human playback

1. A builder opens the compact app-frame demo and toggles its inspector drawer.
2. The drawer shows the active page/context through the same calm inspector language instead of ad hoc lines.
3. The builder opens the canonical release-workbench inspector drawer.
4. The same block language appears there too, even though the surface is richer and region-aware.
5. The builder can see that inspector panels are now a reusable block, not just one good-looking detail box in DOGFOOD.

## Agent playback

1. An agent opens the DL-007 cycle doc.
2. It can identify the promotion seam as `inspectorDrawer()` plus two existing example surfaces.
3. It can run cycle and package tests and see explicit assertions for drawer-attached inspector structure in both examples.
4. It can point to the next design-language backlog item once the cycle is closed.

## Linked invariants

- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)
- [Visible Controls Are a Promise](/Users/james/git/bijou/docs/invariants/visible-controls-are-a-promise.md)
- [Graceful Lowering Preserves Meaning](/Users/james/git/bijou/docs/invariants/graceful-lowering-preserves-meaning.md)
- [Shell Owns Shell Concerns](/Users/james/git/bijou/docs/invariants/shell-owns-shell-concerns.md)
- [Docs Are the Demo](/Users/james/git/bijou/docs/invariants/docs-are-the-demo.md)

## Invariants for this cycle

- inspector block promotion must prove recurrence in more than one real surface
- drawer ownership must stay with the shell/TUI layer, not leak into the core component
- core `inspector()` semantics must remain usable outside the block
- block composition must not rely on nested decorative chrome to communicate structure
- pipe and accessible modes must preserve the same current-selection and section meaning

## Implementation outline

1. Move DL-007 into the active cycle area and enrich it with playbacks and invariants.
2. Write failing cycle and package tests for a reusable `inspectorDrawer()` helper.
3. Refine `inspector()` only as needed for clean block composition.
4. Implement `inspectorDrawer()` in `@flyingrobots/bijou-tui`.
5. Migrate the compact app-frame demo and canonical release-workbench drawer to the block helper.
6. Close the cycle and spawn the next design-language backlog item.

## Tests to write first

Under `tests/cycles/DL-007/`:

- the active cycle doc includes the required workflow sections
- `inspectorDrawer()` renders current-selection inspector content inside drawer chrome without losing lowering semantics
- the compact app-frame example uses the promoted block
- the canonical release-workbench uses the promoted block
- the next design-language backlog item exists

## Risks

- promoting a block too early and freezing the wrong responsibilities
- adding so much API shape that the helper becomes harder to use than raw `drawer()`
- coupling the helper too tightly to one example instead of a reusable shell pattern

## Out of scope

- generalized inspector routing/state
- notification-center migration
- localization-specific inspector work
- guided-flow block promotion

## Retrospective

### What landed

- a new `inspectorDrawer()` helper in `@flyingrobots/bijou-tui`
- a chrome-less composition mode for `inspector()` so the block can use drawer chrome without nested decorative boxes
- the compact app-frame demo now proves the block in a smaller shell surface
- the canonical release-workbench now proves the block in a richer pane-scoped shell surface
- cycle and package tests that make inspector block promotion executable instead of only aspirational

### Drift from ideal

This cycle did not introduce a generalized inspector runtime or inspector state model.

That was intentional and correct.

The right promotion step was one block helper composed from stable patterns and ownership rules, not a larger shell subsystem.

### Debt spawned

Spawned:

- [DL-008 — Promote Guided Flow Block](/Users/james/git/bijou/docs/BACKLOG/DL-008-promote-guided-flow-block.md)
