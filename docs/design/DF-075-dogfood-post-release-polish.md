---
title: DF-075 DOGFOOD Post-Release Polish
legend: DF
lane: inbox
priority: medium
status: proposed
github_issue: 334
keywords:
  - dogfood
  - app-shell
  - quit-confirm
  - blocks
  - polish
---

# DF-075 DOGFOOD Post-Release Polish

Legend: [DF - DOGFOOD](../legends/DF-dogfood.md)

## Linked Work

- GitHub Issue: #334
- Related future release-story work: #335
- Related future affordance work: #336

This document scopes a bounded post-release polish cycle. It does not reopen
the `v7.1.0` feature train and it does not claim the broader V8 Runtime Graph
and Scene IR product surface.

## Decision Summary

DOGFOOD should absorb the three most visible post-release polish findings from
the `v7.1.0` sanity pass without expanding into a broad shell redesign:

1. Disable the hidden double-`Tab` footer toggle until the AppShell has a
   visible command, animation, and restore affordance.
2. Restyle the quit confirmation so it is compact, themed, aligned, and easy
   to answer in the default theme.
3. Make the Blocks section lead with `CounterDemoBlock`, because that is the
   most alive interactive proof of what Blocks are.

## Sponsored Human

A DOGFOOD user wants the docs app to feel deliberate after `v7.1.0`: no hidden
state that leaves terminal background behind, no awkward quit prompt, and a
Blocks page that immediately demonstrates an interactive block instead of
starting on descriptive prose.

## Sponsored Agent

An agent wants deterministic behavior to assert: footer visibility should not
change through undocumented key timing, the quit dialog should have stable
themed geometry, and the Blocks default route should identify the same guide id
that renders the interactive counter proof.

## Hill

DOGFOOD can start the post-`v7.1.0` era with a cleaner shell and a stronger
Blocks first impression while keeping the patch small, testable, and isolated
from V8 product-contract work.

## Scope

### Disable Hidden Footer Toggle

The current hidden double-`Tab` footer toggle is not discoverable. When hidden,
it can expose uncolored terminal background and does not explain how to recover
the footer. This cycle should remove that key path from normal DOGFOOD/AppShell
input handling. `Tab` should remain the normal focus traversal key.

This does not forbid a future footer command. A future version can reintroduce
footer visibility as an explicit command with visible state, animation, help
text, and theme-safe repaint behavior.

### Restyle Quit Confirmation

The quit confirmation should render as a compact modal rather than a tall,
skinny prompt. Its background, border, title, body, and actions should use the
selected frame theme instead of leaving unthemed terminal patches.

The action labels must be readable in the default DOGFOOD theme. The dialog
should keep the existing command contract: confirm quits, reject closes the
dialog, and normal app state remains underneath.

### Counter-First Blocks

The Blocks section should open directly on `CounterDemoBlock`. Selecting the
`Block Preview` parent row should also route to `CounterDemoBlock`, making the
preview group demonstrate an interactive block first.

Static and descriptive block previews remain available below it. The prior
navigation fix that lets focus move from the first preview child back to the
`Block Preview` parent row must not regress.

## Out Of Scope

- #335 release-story surfaces: What's New, GraphQL proof, and CHANGELOG viewer.
- #336 future affordances: theme hotkey, tab badges, tutorial, and achievements.
- A full AppShell animation or layout redesign.
- A new `v7.2.0` feature train.
- Broad V8 Runtime Graph and Scene IR product-contract work.

## Playback Questions

1. Does pressing `Tab` repeatedly leave the footer visible and themed?
2. Does the quit confirmation render with compact themed geometry and readable
   `Yes` / `No` actions?
3. Does opening Blocks, or activating `Block Preview`, show
   `CounterDemoBlock` first?
4. Does arrow navigation still allow the `Block Preview` parent row to receive
   focus from the first standard block preview child?

## Test Plan

- Add or update DOGFOOD Blocks tests in
  `tests/cycles/DX-031/dogfood-blocks-section.test.ts` for initial Blocks
  selection and `Block Preview` activation.
- Add AppShell regression coverage proving `Tab` no longer emits a hidden
  footer toggle path.
- Extend quit confirmation tests in `packages/bijou-tui/src/` so the modal's
  compact geometry and action styling are observable.
- Run the focused test files, `npm run typecheck:test`, `npm run lint`,
  `npm run docs:inventory`, `git diff --check`, and the relevant broader suite
  before review.

## Acceptance Criteria

- Double-`Tab` no longer hides the DOGFOOD footer.
- The quit confirmation is compact, filled, aligned, and theme-readable.
- Blocks starts on `CounterDemoBlock`, and the `Block Preview` parent opens the
  same interactive demo.
- Existing Blocks guide focus behavior remains intact.
- The change is linked from #334 and carried by a non-draft PR to `main`.
