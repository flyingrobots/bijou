---
title: "DX-019 — Third-Party Theme Reactivity Hook"
legend: DX
lane: retro
---

# DX-019 — Third-Party Theme Reactivity Hook

Completed on `release/v5.0.0`. Bijou now exposes `observeTheme(ctx, handler)`
as the public theme-change seam in `packages/bijou/src/context-theme.ts`,
documents that contract in `packages/bijou/ADVANCED_GUIDE.md`,
`packages/bijou/ARCHITECTURE.md`, and `docs/design-system/theme-tokens.md`, and
covers it in `packages/bijou/src/context-theme.test.ts`. Third-party code no
longer needs to reach into `tokenGraph` internals just to react to theme
updates.

## Original Proposal

Legend: [DX — Developer Experience](../legends/DX-developer-experience.md)

## Problem

Bijou's theme/token system is strong inside core components, but
third-party component authors do not have a clearly supported way to
react to theme changes. Today this often falls back to manual context
cloning or ambient-default assumptions.

The 2026-04-11 code-quality audit explicitly called out the lack of a
supported subscription path for external components.

## Desired outcome

1. Define a public reactivity seam for theme/token updates.
2. Decide whether that seam is a direct `tokenGraph.subscribe()` export,
   a context-level wrapper, or a narrower theme-change subscription
   contract.
3. Document how third-party components should observe theme changes
   without mutating context or relying on private internals.

## Effort

Medium — public API design plus advanced-guide documentation.
