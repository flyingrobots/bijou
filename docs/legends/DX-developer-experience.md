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

- latest completed closures:
  - [DX-028 — Align front-door docs with repo truth](../method/retro/DX-028-align-front-door-docs-with-repo-truth.md)
  - [DX-020 — Layout Localization Pipeline Guide](../method/retro/DX-020-layout-localization-pipeline-guide.md)
  - [DX-019 — Third-Party Theme Reactivity Hook](../method/retro/DX-019-third-party-theme-reactivity-hook.md)
- current exploratory backlog:
  - [DX-027 — Choose-Your-Lane Starter for README and DOGFOOD](../method/backlog/cool-ideas/DX-027-choose-your-lane-starter-for-readme-and-dogfood.md)
  - [DX-026 — Mode-Lowering Linter](../method/backlog/cool-ideas/DX-026-mode-lowering-linter.md)
  - [DX-025 — Component Metadata Contract](../method/backlog/cool-ideas/DX-025-component-metadata-contract.md)
- historical backlog lineage:
  - [DX-003 — Rationalize Table APIs and Public Table Types](../method/retro/DX_003-rationalize-table-apis-and-public-table-types.md)
  - [DX-004 — Smooth Surface and String Composition Seams](../method/retro/DX_004-smooth-surface-and-string-composition-seams.md)
  - [DX-005 — Polish Small Component and Import Ergonomics](../method/retro/DX_005-polish-small-component-and-import-ergonomics.md)
