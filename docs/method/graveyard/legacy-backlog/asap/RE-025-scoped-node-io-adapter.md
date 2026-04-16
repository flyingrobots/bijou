# RE-025 — Scoped Node IO Adapter

Legend: [RE — Runtime Engine](../../legends/RE-runtime-engine.md)

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
