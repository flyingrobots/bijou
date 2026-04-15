---
title: "RE-025 — Scoped Node IO Adapter"
legend: RE
lane: retro
---

# RE-025 — Scoped Node IO Adapter

Completed on `release/v5.0.0`. `@flyingrobots/bijou-node` now exports
`scopedNodeIO()` from `packages/bijou-node/src/io.ts`, rejects path escapes via
`ScopedNodeIOError`, covers rooted reads and traversal failures in
`packages/bijou-node/src/io.test.ts`, and documents when to prefer the scoped
adapter in the package README, GUIDE, and ARCHITECTURE docs.

## Original Proposal

Legend: [RE — Runtime Engine](../legends/RE-runtime-engine.md)

## Problem

`@flyingrobots/bijou-node` exposes broad host IO capabilities, but the
repo does not yet provide a first-class way to scope filesystem access
to a rooted sandbox for app-level use.

The 2026-04-11 ship-readiness audit called out this gap directly: a
component handed raw `nodeIO` can read arbitrary system paths unless the
host wraps and constrains it manually.

## Desired outcome

1. Add a scoped IO adapter in `@flyingrobots/bijou-node`.
2. Let hosts define a root boundary that constrains reads, writes, and
   directory traversal.
3. Return clear errors when a requested path escapes the allowed root.
4. Document when apps should prefer scoped IO over raw host IO.

## Effort

Medium — adapter design, path-normalization rules, and host tests.
