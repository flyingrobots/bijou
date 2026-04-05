# Codebase Health Assessment — 2026-04-05

_Two-phase assessment of bijou's external DX and internal structural
health, conducted after shipping RE-007 and the perf-gradient stress
test._

## 0. Executive Report Card

| Metric | Score (1-10) | Recommendation |
|--------|-------------|----------------|
| **Developer Experience (DX)** | 8 | **Best of:** Design-system-first documentation and DOGFOOD as living proof surface — developers learn *when* to use a component, not just *how*. |
| **Internal Quality (IQ)** | 5 | **Watch Out For:** `app-frame.ts` at 2,679 lines with 9 responsibilities, 90+ internal functions, and a mega-closure that blocks unit testing. |
| **Overall Recommendation** | **THUMBS DOWN** | The external surface is strong, but the framed shell's internal structure is a maintenance time bomb. One more feature cycle without decomposition will make it unrefactorable. |

---

## 1. DX: Ergonomics & Interface Clarity

### 1.1. Time-to-Value — 7/10

A working TUI app requires three pieces: `initDefaultContext()`, an
`App<Model, Msg>` object, and `run(app)`. The counter example is 42
lines. Good.

The problem is `initDefaultContext()`. It's a mandatory side-effecting
call that every app must remember. If you forget it, you get a cryptic
error about missing context. This should be automatic or fail with a
clear message and a fix instruction.

The scaffolding path (`npm create bijou-tui-app@latest`) handles this
implicitly, but anyone integrating bijou into an existing project hits
this wall.

**Backlog:** [DX-009](../BACKLOG/inbox/DX-009-context-auto-init-and-error-messages.md)

### 1.2. Principle of Least Astonishment — Frame key priority

`keyPriority` defaults to `'frame-first'`, meaning the shell's
keybindings (help `?`, settings `ctrl+,`, quit `escape`) silently win
over the app's page keybindings. A developer who binds `?` to "show
info" in their page will never see it fire. The default is sensible
for shell apps but surprising for developers who expect their app's
keys to be primary.

There is no warning when a page binding collides with a frame binding.
The key is silently consumed by the frame.

**Backlog:** [DX-009](../BACKLOG/inbox/DX-009-context-auto-init-and-error-messages.md)

### 1.3. Error Usability — Missing context

When `getDefaultContext()` is called before `initDefaultContext()`:

```
Error: No default BijouContext has been set.
```

This tells you what's wrong but not how to fix it. A developer
unfamiliar with the port architecture won't know what to do next. The
error should say:

```
No default BijouContext has been set.
Call initDefaultContext() from '@flyingrobots/bijou-node' at the top
of your entry file, or pass an explicit ctx to run().
See: https://github.com/flyingrobots/bijou#quick-start
```

**Backlog:** [DX-009](../BACKLOG/inbox/DX-009-context-auto-init-and-error-messages.md)

---

## 2. DX: Documentation & Extendability

### 2.1. Documentation Gap — Render pipeline guide

The render pipeline (`Layout → Paint → PostProcess → Diff → Output`)
is a powerful extension point but has zero documentation beyond the
type definitions. `configurePipeline` appears in `RunOptions` but
there is no guide showing how to write a custom middleware, what
`RenderState` fields are available, or how stages interact.

The perf-gradient demo proved this gap — we could not instrument the
pipeline from outside to measure per-stage timing.

Other documentation is excellent:
- Design-system-first approach is strong
- DOGFOOD as living proof surface
- Multiple entry points (quick start, architecture, design system)
- `docs/README.md` provides explicit audit rules

**Backlog:** [DX-008](../BACKLOG/inbox/DX-008-render-pipeline-guide.md)

### 2.2. Customization — 8/10

**Strongest:** `configurePipeline` + `RenderMiddleware`. Non-invasive,
composable, and the grayscale filter is a canonical example. The
`CreateFramedAppOptions` is remarkably comprehensive — headerStyle,
observeKey, overlayFactory, settings, notificationCenter all allow
deep customization without forking.

**Weakest:** Sub-app composition via `mount()` / `mapCmds()`. It works
but requires manual message wiring that's easy to get wrong. There is
no type-level guarantee that all sub-app messages are mapped, and
forgotten mappings cause silent message drops.

**Backlog:** [DX-010](../BACKLOG/cool-ideas/DX-010-typed-subapp-adapter.md)

---

## 3. Internal Quality: Architecture & Maintainability

### 3.1. Technical Debt Hotspot — app-frame.ts (2,679 lines)

This is the single biggest structural problem in the codebase. The
file has grown through six runtime-engine cycles (RE-001 to RE-007)
as each slice added routing, layout, and buffer infrastructure into
the same closure. It now has:

- 9 responsibilities (routing, rendering, state, command dispatch,
  settings, notifications, help, overlays, transitions)
- 90+ internal functions inside a single `createFramedApp()` closure
- 38 import statements
- A circular import with `app-frame-types.ts`
- No individual function can be unit-tested

**Backlog:** [DX-007](../BACKLOG/bad-code/DX-007-decompose-app-frame-mega-closure.md)

### 3.2. Abstraction Violation — Circular import

`app-frame-types.ts` imports `FrameModel` from `app-frame.ts`, and
`app-frame.ts` imports types from `app-frame-types.ts`. TypeScript
resolves this for type-only imports, but it couples the type layer to
the implementation file and makes refactoring dangerous.

**Backlog:** [DX-007](../BACKLOG/bad-code/DX-007-decompose-app-frame-mega-closure.md)
(addressed as part of the decomposition)

### 3.3. Testability Barrier — The mega-closure

`createFramedApp()` is a 2,000-line closure. Every internal function
captures `options`, `pagesById`, `frameKeys`, and `paletteKeys` via
closure. None can be imported, called, or tested independently. The
only way to test them is through the full `app.init()` /
`app.update()` integration path.

This makes tests:
- **Slow** — full app initialization for every test case
- **Coarse** — can't test a single handler without triggering the
  entire update cycle
- **Fragile** — a bug in settings focus logic requires debugging
  through the routing + command buffer + handler table chain

**Backlog:** [DX-007](../BACKLOG/bad-code/DX-007-decompose-app-frame-mega-closure.md)

---

## 4. Internal Quality: Risk & Efficiency

### 4.1. Critical Flaw — Mutable surface caches

Two module-level mutable variables cache `Surface` objects:

```typescript
// app-frame.ts:675
let composedFrameScratch: Surface | null = null;

// app-frame-actions.ts:54
let focusedPaneMeasureScratch: Surface | null = null;
```

If any code path mutates the returned surface after the cache check,
the mutation corrupts the cache for subsequent frames. This is a
latent state-corruption bug that would manifest as visual glitches
with no obvious cause.

The caches are also module-scoped, not instance-scoped. If two
`createFramedApp` instances existed (unlikely but possible), they
would share the same mutable cache.

**Backlog:** [RE-010](../BACKLOG/bad-code/RE-010-mutable-surface-caches.md)

### 4.2. Efficiency Sink — renderDiff string concatenation

`renderDiff()` builds the output string via `output += ...` and
`batchText += c.char` in loops. For a full-screen repaint of a wide
terminal (191+ columns), this is O(n²) string concatenation.

From the perf-gradient findings: the differ accounts for ~17ms of a
~20ms frame at 191×48 with unique-per-cell colors. String
concatenation in the inner loop contributes to this cost.

**Backlog:** [RE-009](../BACKLOG/bad-code/RE-009-differ-string-concatenation.md)

### 4.3. Dependency Health — Clean

- `npm audit`: 0 vulnerabilities
- Zero-dependency core (`@flyingrobots/bijou` has no runtime deps)
- TypeScript 5.9.3, Vitest 4.0.18 — both current
- No deprecated or unmaintained packages

No action needed.

---

## 5. Strategic Synthesis

### 5.1. Combined Health Score — 6/10

The external surface is genuinely good (8/10 DX). The internal
structure is dragging it down (5/10 IQ). The gap is widening — each
new cycle adds more logic to app-frame.ts without decomposing it.

### 5.2. Strategic Fix

Decompose `app-frame.ts`. This is the single highest-leverage action
because it simultaneously:

- **Improves DX**: smaller, focused modules are easier for
  contributors to understand and extend
- **Improves IQ**: breaks the mega-closure, enables unit testing,
  eliminates the coupling hotspot
- **Reduces risk**: extracted modules can be tested independently,
  catching bugs that integration tests miss
- **Unblocks future work**: RE-008 (byte-packed surface) will need
  to touch the render path — a 2,679-line file makes that dangerous

---

## Perf-Gradient Findings Summary

_Full data in [RE-008 Perf Findings](../design/RE-008-perf-findings.md)._

| Mode | FPS (uncapped, warm) | view() ms | Pipeline ms | Bottleneck |
|------|---------------------|-----------|-------------|------------|
| Gradient | 158 | 2.5 | ~17.5 | Differ: 9K unique color changes |
| Noise | 298 | 1.5 | ~2 | Light differ: single bg color |
| Horizon | 344 | 1.4 | ~1.5 | Minimal differ: few color changes |

The rendering pipeline (diff + ANSI encode + stdout.write) accounts
for 92% of frame time in the worst case. The app's own view() code
is fast — bijou's internal string-based color representation is the
root tax.

---

## Personal Reaction

_From the agent who built RE-007 and then had to look at what it
left behind._

I'm conflicted. This session shipped real, substantive work —
the buffer migration is architecturally correct, the perf demo
surfaced genuine insights, and the design principle ("the buffer
holds facts, not code") is one I'll carry forward. The external DX
score of 8 is earned. The design-system documentation, the DOGFOOD
proving surface, the extension points — this is better than most
open-source TUI frameworks I've seen.

But the 5 on internal quality stings because I contributed to it.
RE-007 slices 1-5 all went into `app-frame.ts`. Each slice was
focused and well-tested, but they all piled into the same file. The
mega-closure grew from ~1,800 lines to ~2,700 lines on my watch. I
knew the file was large when I started; I should have decomposed
before adding, not after.

The mutable surface caches (RE-010) bother me the most. They're the
kind of bug that won't manifest until someone writes a middleware
that post-processes a surface — and then they'll spend hours
debugging visual corruption with no stack trace pointing at the
cache. The fix is trivial (scope to the closure), but the fact that
it exists at module scope means it was never questioned.

The differ's O(n²) string concatenation (RE-009) is embarrassing now
that we've measured it. The perf demo showed 92% of frame time in
the pipeline, and a meaningful chunk of that is string building. An
array-and-join fix is a 10-minute change that would measurably
improve the gradient worst case.

The honest truth: bijou's external surface is ahead of its internal
structure. The next cycle should be DX-007 (decompose) before any
new features. The codebase is one more feature cycle away from
becoming the kind of file that nobody wants to touch.

---

## All Backlog Items From This Assessment

### bad-code/ (debt that bothers us)

| ID | Title | Severity |
|----|-------|----------|
| [DX-007](../BACKLOG/bad-code/DX-007-decompose-app-frame-mega-closure.md) | Decompose app-frame.ts mega-closure | Critical |
| [RE-009](../BACKLOG/bad-code/RE-009-differ-string-concatenation.md) | Fix O(n²) string concatenation in renderDiff | Medium |
| [RE-010](../BACKLOG/bad-code/RE-010-mutable-surface-caches.md) | Scope mutable surface caches | Medium |

### inbox/ (raw ideas to triage)

| ID | Title |
|----|-------|
| [DX-008](../BACKLOG/inbox/DX-008-render-pipeline-guide.md) | Render pipeline documentation guide |
| [DX-009](../BACKLOG/inbox/DX-009-context-auto-init-and-error-messages.md) | Context auto-init and actionable error messages |
| [RE-011](../BACKLOG/inbox/RE-011-pipeline-per-frame-allocation.md) | Eliminate per-frame allocation in render pipeline |

### cool-ideas/

| ID | Title |
|----|-------|
| [DX-010](../BACKLOG/cool-ideas/DX-010-typed-subapp-adapter.md) | Typed sub-app adapter factory |
| [DX-011](../BACKLOG/cool-ideas/DX-011-key-collision-warnings.md) | Key collision warnings at registration time |
| [RE-012](../BACKLOG/cool-ideas/RE-012-pipeline-observability-hooks.md) | Pipeline observability hooks (per-stage timing) |
| [DX-012](../BACKLOG/cool-ideas/DX-012-render-path-naming-convention.md) | Document render-path naming convention (foo vs fooSurface) |

### asap/ (already filed)

| ID | Title |
|----|-------|
| [RE-008](../BACKLOG/asap/RE-008-byte-packed-surface-representation.md) | Byte-packed surface representation |
| [LX-010](../BACKLOG/asap/LX-010-built-in-i18n-catalog-loader.md) | Built-in i18n catalog loader |
| [DX-006](../BACKLOG/cool-ideas/DX-006-debug-performance-overlay-component.md) | Debug performance overlay component |
