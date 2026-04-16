# DX-017 — One-Call Node Host Entry Point

Legend: [DX — Developer Experience](../../legends/DX-developer-experience.md)

## Problem

Simple interactive apps currently have to compose multiple setup steps
by hand:

- initialize a default context
- choose the Node host adapter package
- run the TEA app
- restore terminal state and shut down cleanly

The pieces exist, but there is no obvious "first real app" entry point
in `@flyingrobots/bijou-node`. The 2026-04-11 code-quality audit
called this out directly as a time-to-value gap.

## Desired outcome

1. Add a `startApp(app, options)`-style entry point in
   `@flyingrobots/bijou-node`.
2. Let it own context initialization, runtime startup, and graceful
   shutdown by default while preserving lower-level escape hatches.
3. Update first-app docs to use this path so the hosted Node story is
   explicit instead of implied.

## Effort

Medium — public host API design plus docs and example updates.
