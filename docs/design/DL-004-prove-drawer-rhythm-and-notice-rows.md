# DL-004 — Prove Drawer Rhythm and Notice Rows

Legend: [DL — Design Language](/Users/james/git/bijou/docs/legends/DL-design-language.md)

## Why this cycle exists

DL-003 proved canonical selected-row treatment in shared collection surfaces.

The next proof slice should move up one layer into shell-adjacent review surfaces:

- drawer rhythm
- inspector-style spacing
- notice and archive rows
- supporting-copy hierarchy in shell review surfaces

The strongest current proving seam is the shell notification center.

It already has:

- shell ownership
- live and archived review concerns
- stack/archive sections
- supporting copy and metadata

But it still renders too much of that surface as a wrapped text blob.

This cycle exists to prove calmer drawer rhythm and reusable notice-row treatment through that seam.

## Scope of this cycle

This cycle intentionally covers:

- the notification-center drawer
- live notice rows
- archived notice rows
- one-cell inset rhythm and calmer section spacing

It does **not** include:

- notification-center discoverability polish
- settings-drawer redesign
- a general block runtime
- action/focus behavior changes for notification review

## Human users

### Primary human user

A shell user reviewing runtime notices in a drawer.

They need:

- section rhythm that feels calm instead of packed
- current and archived notices that read like rows, not like a log blob
- supporting copy that looks supporting

### Human hill

A user can open the notification drawer and parse live versus archived notices quickly without the drawer feeling like a pasted text dump.

## Agent users

### Primary agent user

An agent inspecting or reviewing shell notification surfaces.

It needs:

- explicit row structure in notice-review surfaces
- stable spacing and section boundaries
- reusable proof that drawer review surfaces follow the design language

### Agent hill

An agent can point to concrete drawer/notice-row behavior that follows the documented design language instead of reverse-engineering a string blob.

## Human playback

1. A user opens the shell notification center.
2. The drawer presents summary lines with breathing room.
3. The current stack is visually separated from archived history.
4. Each notice reads as a compact row with inset primary and secondary text.

## Agent playback

1. An agent opens the DL-004 cycle doc.
2. It can identify the shell notification center as the proving seam.
3. It can run cycle/package tests and see explicit assertions for inset drawer rhythm and structured notice rows.
4. It can point to the next backlog item for follow-on drawer/block work.

## Linked invariants

- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)
- [Focus Owns Input](/Users/james/git/bijou/docs/invariants/focus-owns-input.md)
- [Visible Controls Are a Promise](/Users/james/git/bijou/docs/invariants/visible-controls-are-a-promise.md)
- [Shell Owns Shell Concerns](/Users/james/git/bijou/docs/invariants/shell-owns-shell-concerns.md)

## Invariants for this cycle

- drawer review surfaces should use one-cell inset rhythm by default
- notice rows should separate primary title from supporting metadata and explanation
- shell review surfaces should remain clearly shell-owned, not page-local
- this cycle should prove calmer structure without changing notification action semantics

## Implementation outline

1. Move DL-004 into the active cycle area and enrich it with playbacks and invariants.
2. Write failing cycle tests for drawer rhythm and notice-row structure.
3. Add a surface-native notice review-row path in `notification.ts`.
4. Update the app-frame notification-center drawer to compose that surface instead of a wrapped text blob.
5. Close the cycle and spawn the next design-language backlog item.

## Tests to write first

Under `tests/cycles/DL-004/`:

- the active cycle doc includes the required workflow sections
- notification review rows use one-cell inset rhythm and keep supporting copy secondary
- the shell notification-center drawer shows section spacing between summary, live stack, and archived history
- the next design-language backlog item exists

## Risks

- burying more bespoke drawer layout inside `app-frame.ts`
- making notice rows too ornamental instead of calm
- changing shell behavior instead of only structure and rhythm

## Out of scope

- notification discoverability
- notification action routing
- general block promotion

## Retrospective

### What landed

- a new surface-native notification review-row path in `notification.ts`
- archived notification history now has a structured surface renderer instead of only a wrapped string path
- the shell notification-center drawer now composes inset summary lines, spaced section headers, live notice rows, and archived history rows as surfaces
- cycle and package tests now lock the calmer drawer rhythm and structured notice-row treatment in place

### Drift from ideal

No material drift.

This cycle intentionally kept behavior stable and only proved calmer structure and hierarchy in the notification review seam.

### Debt spawned

Spawned:

- [DL-005 — Prove Inspector and Guided Flow Rhythm](/Users/james/git/bijou/docs/BACKLOG/DL-005-prove-inspector-and-guided-flow-rhythm.md)
