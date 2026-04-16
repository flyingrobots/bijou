---
title: DX-010 — Typed Sub-App Adapter Factory
lane: retro
legend: DX
---

# DX-010 — Typed Sub-App Adapter Factory

## Disposition

Shipped `createSubAppAdapter()` in `@flyingrobots/bijou-tui` as an exhaustive discriminant-based `onMsg` factory for sub-app composition. The canonical sub-app example, package docs, and guide now use the helper, and compile-time coverage is proven with `@ts-expect-error` regression assertions in the sub-app mount tests while `mapCmd` remains available for explicit command interception.

## Original Proposal

Legend: [DX — Developer Experience](../legends/DX-developer-experience.md)

## Idea

Replace the manual `mount()` / `mapCmds()` pattern with a
compile-time-checked adapter factory:

```typescript
const adapter = createSubAppAdapter<ParentMsg, ChildMsg>({
  'child-done': (msg) => ({ type: 'panel-closed' }),
  'child-error': (msg) => ({ type: 'show-alert', text: msg.error }),
});
```

TypeScript enforces that every `ChildMsg` variant is covered. A
forgotten mapping is a compile error, not a silent message drop.

## Why

The current `mapCmds()` pattern works but requires manual wiring
with no type-level guarantee of completeness. In larger apps with
multiple sub-apps, a missing mapping causes a message to vanish
silently — the hardest kind of bug to diagnose in a TEA
architecture.

## Open questions

- Should the adapter handle both messages and commands, or just
  messages?
- Should it support pass-through for shared message types?
