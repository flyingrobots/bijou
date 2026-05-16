---
title: DX-033 Remove showcase layout sludge
legend: DX
lane: v6.0.0
priority: medium
keywords:
  - examples
  - layout
  - scrolling
  - strings
  - debt
---

# DX-033 Remove showcase layout sludge

Debt pulled from the bad-code lane for the v6 layout-and-blocks release.

## 2026-04-26

### [Severity: Low] Loose Typing in `StartAppOptions`
- **Location:** `packages/bijou-node/src/index.ts`
- **Anti-pattern:** `export type StartAppOptions<M = any> = RunOptions<M> & NodeThemeOptions;`
- **Rationale:** The use of `any` as a default for the message type `M` weakens the type safety of the TEA loop. While it provides convenience for quick scripts, industrial-grade applications should require explicit message types to prevent "side-effect soup" and ensure the `update` function remains a pure, predictable state transformer.
- **Refactor Suggestion:** Change the default to `never` or `unknown` to force callers to specify their message type, or provide a strictly typed internal `DefaultMsg` for the simple cases.

### [Severity: Medium] Manual View-State Logic (Scrolling/Slicing)
- **Location:** `examples/showcase/app.ts:114`
- **Anti-pattern:** The view renderer manually slices the item list based on scroll position (`items.slice(scrollY, scrollY + visibleCount)`).
- **Rationale:** View rendering should be a pure projection of state. Scrolling logic and slicing are domain/application concerns that should be handled by a component (like `list()`) or a selector, not repeated at every call site.
- **Refactor Suggestion:** Use a high-level `browsableList()` component that accepts the state and handles rendering, or delegate slicing to a domain function.

### [Severity: Low] Manual String Assembly (Sludge)
- **Location:** `examples/showcase/registry.ts`, `examples/showcase/app.ts`
- **Anti-pattern:** Heavy use of `.join('\n')` and manual space padding (e.g., `'  '`) for layout.
- **Rationale:** This violates "Geometric Lawfulness" and the "2-cell rhythm." It makes the layout brittle and bypasses the Bijou layout engine's ability to handle wrapping, clipping, and alignment.
- **Refactor Suggestion:** Replace with `column()`, `row()`, and `box()` primitives.

### [Severity: Low] Hardcoded Rhythm Violations
- **Location:** `examples/showcase/app.ts:74`
- **Anti-pattern:** `width - 4` and manual empty strings for vertical spacing.
- **Rationale:** Violates the "2-cell rhythm" invariant. 
- **Refactor Suggestion:** Use layout-driven constraints and `spacer()` or padding properties in `box()`.
