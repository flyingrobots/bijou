# DX — Developer Experience

_Legend for making Bijou's APIs easier to learn, type, compose, and ship against without trial-and-error_

## Goal

Make Bijou feel intentional to build with, not merely powerful once you already know the quirks.

This legend exists to improve:

- API consistency
- type safety
- composition ergonomics
- migration clarity
- small but recurring friction in common authoring flows

## Human users

- app builders using Bijou directly
- maintainers shaping public APIs
- contributors working across `bijou`, `bijou-tui`, and the docs field guide

## Agent users

- coding agents generating Bijou apps from scratch
- agents repairing type errors and lint failures
- agents composing components without hidden string-vs-surface traps

## Human hill

A builder can reach for common Bijou APIs without having to discover calling conventions, hidden type seams, or composition gotchas by compiler error and trial-and-error.

## Agent hill

An agent can inspect the public API surface and produce type-safe Bijou code without cascading `any`, undocumented helper casts, or package-boundary guesswork.

## Core invariants

- [Runtime Truth Wins](../invariants/runtime-truth-wins.md)
- [Schemas Live At Boundaries](../invariants/schemas-live-at-boundaries.md)
- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)
- [Commands Change State, Effects Do Not](../invariants/commands-change-state-effects-do-not.md)

## Related doctrine

- [System-Style JavaScript](../system-style-javascript.md)

## Current cycle and backlog

- latest completed cycles:
  - [DX-012 — Document Render-Path Naming Convention](../graveyard/DX_012-render-path-naming-convention.md)
  - [DX-011 — Key Collision Warnings at Registration Time](../graveyard/DX_011-key-collision-warnings.md)
  - [DX-010 — Typed Sub-App Adapter Factory](../graveyard/DX_010-typed-subapp-adapter.md)
  - [DX-006 — Debug Performance Overlay Component](../graveyard/DX_006-debug-performance-overlay-component.md)
  - [DX-008 — Render Pipeline Documentation Guide](../graveyard/DX_008-render-pipeline-guide.md)
  - [DX-005 — Polish Small Component and Import Ergonomics](../graveyard/DX_005-polish-small-component-and-import-ergonomics.md)
  - [DX-004 — Smooth Surface and String Composition Seams](../graveyard/DX_004-smooth-surface-and-string-composition-seams.md)
  - [DX-003 — Rationalize Table APIs and Public Table Types](../graveyard/DX_003-rationalize-table-apis-and-public-table-types.md)
  - [DX-001 — Type Framed App Messages and Updates End-to-End](../design/DX-001-type-framed-app-messages-and-updates-end-to-end.md)
  - [DX-002 — Reconcile Cmd Typing With Cleanup and Effect Patterns](../design/DX-002-reconcile-cmd-typing-with-cleanup-and-effect-patterns.md)
- live backlog:
  - no dedicated DX cycle is live right now
