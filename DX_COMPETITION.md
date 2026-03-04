# DX Competition Deep Dive (App Shell Primitives)

Date: 2026-03-04

## Goal
This document compares Bijou's current app-shell DX against other mature TUI stacks, specifically to inform:

- Phase 8: `splitPane()` and `grid()`
- Phase 9: `appFrame()`

Roadmap context: `docs/ROADMAP.md` lines 98-119.

## Method (What I Actually Did)
I cloned and inspected real upstream repos under `/tmp/bijou-dx-competition` and compared them against Bijou examples and runtime primitives.

Repos inspected:

- Bubble Tea: `/tmp/bijou-dx-competition/bubbletea`
- Bubbles: `/tmp/bijou-dx-competition/bubbles`
- Lip Gloss: `/tmp/bijou-dx-competition/lipgloss`
- Ratatui: `/tmp/bijou-dx-competition/ratatui`
- Textual: `/tmp/bijou-dx-competition/textual`
- Ink: `/tmp/bijou-dx-competition/ink`

Smoke/tinker checks run:

- Bubble Tea: `go test ./simple` in `bubbletea/examples` (passes, dependencies downloaded)
- Ratatui: `cargo check` in `ratatui/examples/apps/hello-world` (passes)
- Textual: install into local venv (system pip blocked by PEP 668), import/version check (`textual 8.0.2`)
- Ink: `npm install` + run `examples/table/table.tsx` (renders expected output)

## Bijou Baseline (Current State)

### What is already strong

- Clear TEA runtime model (`run`, `App`, `update`, `view`) and composable primitives in `bijou-tui`.
- Strong low-level building blocks already exist:
  - `createPanelGroup()` for focus + panel hotkeys (`packages/bijou-tui/src/panels.ts`)
  - `createInputStack()` for layered routing (`packages/bijou-tui/src/inputstack.ts`)
  - `focusArea()` with immutable state transformers (`packages/bijou-tui/src/focus-area.ts`)
- Core package has graceful degradation modes (interactive/static/pipe/accessible) and zero-runtime deps.

### Where app-shell DX still hurts
Using `examples/split-editors/main.ts` as a concrete sample:

- Manual resize tracking in app model (`cols`, `rows`) and explicit handling in `update`.
- Manual per-pane scroll state wiring (`leftScroll`, `rightScroll`).
- Manual focus switching and key dispatch conditionals.
- Manual width math and separator rendering.
- Manual help-row assembly.

This is exactly the Phase 8/9 pain statement in the roadmap: repeated shell boilerplate for non-trivial apps.

### Complexity snapshot (equivalent-ish examples)

- Bijou split editors: `163` LOC (`examples/split-editors/main.ts`)
- Bubble Tea split editors: `235` LOC (`bubbletea/examples/split-editors/main.go`)
- Textual code browser: `88` LOC Python + `31` LOC CSS (`textual/examples/code_browser.py`, `.tcss`)
- Ink router sample: `64` LOC (`ink/examples/router/router.tsx`)
- Ratatui hello-world: `62` LOC (minimal), but full demo app is spread over many files with heavy ceremony.

Inference: Bijou is already competitive with low-level TEA stacks on boilerplate, but not yet competitive with high-level shell frameworks (Textual-style ergonomics).

## Competitive Findings

## Comparison Matrices

### Matrix A: High-Level DX Profile (App Shell Work)

Legend:

- `High` = strong out-of-the-box support
- `Medium` = workable with moderate custom glue
- `Low` = mostly hand-rolled by app authors

| Stack | Programming Model | App Shell Out of Box | Multi-Pane Layout DX | Keymap + Help Discoverability | Interaction Testing DX | Accessibility / Degradation | Setup Friction | Remarks |
|---|---|---|---|---|---|---|---|---|
| Bijou | TEA + pure state transformers | Medium | Medium (strong primitives, missing shell wrapper) | Medium-High | Medium | High | Low | Distinctive degradation strategy; main gap is shell abstraction density. |
| Bubble Tea (+ Bubbles/Lip Gloss) | TEA + component models | Medium | Medium | High | Medium | Medium | Low | Excellent key/help ecosystem; shell still requires notable manual composition. |
| Ratatui | Immediate mode + explicit event loop | Low | Medium (powerful, but manual) | Medium | Medium | Medium | Medium | Very capable and explicit, but ceremony is highest for full apps. |
| Textual | Retained widget tree + reactive state + CSS | High | High | High | High | Medium-High | Medium | Strongest batteries-included app-shell DX and test ergonomics. |
| Ink | React renderer + hooks | Medium | Medium | Medium | Medium-High | Medium | Low | Fast onboarding for React users; richer shell often pushes into ecosystem packages. |

WINNER = Textual  
Rationale: it scores highest on shell defaults, layout ergonomics, discoverability, and interaction testing as one integrated stack.

2nd place = Bijou  
Rationale: it is the most balanced TEA option here with strong primitives and excellent degradation behavior, but still needs `appFrame`-level ergonomics.

### Matrix B: Shell Responsibility Ownership

This is the practical "who owns the boilerplate" matrix for non-trivial apps.

| Concern | Bijou (today) | Bubble Tea | Ratatui | Textual | Ink | Remarks |
|---|---|---|---|---|---|---|
| Tab/page chrome | App author | App author | App author | Framework/widgets | App author or router pkg | Only Textual provides true first-party shell chrome defaults. |
| Pane focus routing | App author (with `createPanelGroup`) | App author | App author | Framework widgets/events | App author (`useFocus`) | Bijou has better primitives than most non-Textual options for this concern. |
| Scroll isolation per pane | App author (with `viewport`/`focusArea`) | App author/components | App author/widgets | Framework widgets | App author/ecosystem | Strong candidate for `appFrame` ownership in Bijou Phase 9. |
| Keymap definitions | Primitive exists (`createKeyMap`) | Strong (`key.Binding`) | App-defined | Built-in bindings/actions | `useInput` + custom logic | Bubble Tea and Textual lead discoverability by default behavior. |
| Auto help from keymap metadata | Available (`helpShort`/`helpView`) | Strong (`help.Model`) | Usually custom | Built-in footer/help patterns | Usually custom | Bijou can close gap quickly by promoting this into `appFrame` defaults. |
| Shell-level composition primitive (`appFrame` equivalent) | Not yet (roadmap) | Not first-party | Not first-party | Yes (effectively) | Not first-party | This is the primary competitiveness lever for Bijou. |

WINNER = Textual  
Rationale: it owns the largest share of shell responsibilities at framework level, minimizing repetitive app-level boilerplate.

2nd place = Bijou  
Rationale: while app authors still own composition today, existing primitives (`createPanelGroup`, `createInputStack`, help generators) provide the best runway for a first-party shell abstraction.

### Matrix C: Boilerplate Pressure (Split-Editor Style Apps)

| Stack | Example LOC (from inspected files) | Observed Boilerplate Pressure | Why | Remarks |
|---|---|---|---|---|
| Bijou | 163 | Medium | Must manually compose resize + focus + scroll + footer help | Lower ceremony than Ratatui-style stacks, but still repetitive without `appFrame`. |
| Bubble Tea | 235 | Medium-High | Similar manual shell wiring + per-component update fan-out | Component quality is high; app-shell assembly remains labor-intensive. |
| Ratatui | 62 (hello), much larger for full demos | High | Explicit terminal/event lifecycle and manual shell architecture | Minimal demos are short; realistic multi-pane apps trend high in ceremony. |
| Textual | 88 Python + 31 CSS | Low-Medium | Framework owns much of shell/layout/event plumbing | CSS and widget model remove a large chunk of custom shell glue. |
| Ink | 64 (router), 49 (table) | Medium | Fast start, but richer shell tends to rely on custom hooks/ecosystem | Great simple-case speed; consistency depends on external packages/conventions. |

WINNER = Textual  
Rationale: lowest observed shell boilerplate pressure for non-trivial app structures due integrated layout/widgets/testing model.

2nd place = Bijou  
Rationale: it stays relatively compact while preserving TEA purity; adding `splitPane`/`grid`/`appFrame` should move it closer to Textual's ergonomics.

### Matrix D: "Copy / Avoid" by Competitor

| Source Stack | Copy Into Bijou | Avoid In Bijou | Remarks |
|---|---|---|---|
| Bubble Tea / Bubbles | Keybinding metadata as canonical source for help and discoverability | Multi-package coupling for baseline shell needs | Most directly useful for `appFrame` help and key discoverability UX. |
| Ratatui | Deterministic, explicit constraint semantics for layout (`grid` tracks, split constraints) | High ceremony terminal/event-loop setup for common apps | Best source for track/constraint language design discipline. |
| Textual | First-class shell defaults and interaction-testing ergonomics | Retained-tree/OOP architectural pivot away from TEA purity | Most relevant reference for Phase 8/9 goal shape. |
| Ink | Declarative composition feel and low ceremony for simple flows | Over-reliance on third-party packages for core shell primitives | Good ergonomics inspiration; keep Bijou core shell primitives first-party. |

WINNER = Textual  
Rationale: it offers the highest-value ideas aligned with the exact roadmap gap (app shell and interaction DX), with clear patterns Bijou can adapt.

2nd place = Bubble Tea / Bubbles  
Rationale: its keymap/help patterns are mature, battle-tested, and highly compatible with Bijou's existing TEA/keybinding model.

## 1) Bubble Tea (+ Bubbles + Lip Gloss)

### Component setup model

- TEA is first-class (`Init`, `Update`, `View`).
- Real-world usage is a stack of libraries:
  - Bubble Tea (runtime)
  - Bubbles (stateful components)
  - Lip Gloss (styling/layout joining)

### DX strengths

- Bubbles provides production-grade interactive components (list, file picker, help, key map, textarea, etc.).
- Keymap + help integration is polished (`key.Binding` + `help.Model`), and help can be generated from bindings.
- Very strong examples catalog (62 example dirs in `bubbletea/examples`).

### DX tradeoffs

- Multi-library mental model: component state models + key bindings + style/layout API can feel fragmented.
- App shell still often requires explicit fan-out update loops and layout plumbing.
- Split-editor example still has substantial manual focus/update/sizing code.

### Relevant takeaway for Bijou

Copy:

- Single-source-of-truth key bindings that auto-generate short/full help.
- Component-level state machines that compose cleanly in parent `update`.

Avoid:

- Requiring users to juggle multiple loosely coupled packages for common shell patterns.

## 2) Ratatui

### Component setup model

- Immediate-mode rendering with explicit terminal/event loop control.
- Very rich built-in widget set and layout constraints.
- Architecture split into core/widgets/backends gives ecosystem flexibility.

### DX strengths

- High control and performance.
- Strong layout constraint vocabulary (`Length`, `Min`, `Fill`, ratios, etc.).
- Good template and example ecosystem (32 app examples in `examples/apps`).

### DX tradeoffs

- Boilerplate cost is high for app lifecycle, terminal setup/restore, event polling, and state wiring.
- App shell composition is mostly user-authored; framework is intentionally low-level.

### Relevant takeaway for Bijou

Copy:

- Constraint language for `grid()` tracks and split sizing.
- Explicit, pure layout solving behavior.

Avoid:

- Forcing users into backend/event-loop ceremony for common cases.

## 3) Textual

### Component setup model

- High-level retained widget tree with CSS-like styling/layout (`.tcss`).
- Reactive state (`reactive`, watchers) and message/event handlers.
- Built-in app shell capabilities (Header/Footer, DirectoryTree, command palette, etc.).

### DX strengths

- Best high-level shell ergonomics in this comparison.
- Complex, useful apps can stay concise because layout and widgets are first-class.
- Strong testing story:
  - `run_test()` headless mode
  - `Pilot` for keyboard/mouse simulation
  - snapshot testing tooling
- Built-in command palette and dev console are excellent productivity multipliers.

### DX tradeoffs

- Different programming model from TEA (retained tree + watchers + async internals).
- Python packaging friction can appear in managed environments (PEP 668 -> requires venv/pipx workflow).

### Relevant takeaway for Bijou

Copy:

- "Batteries included" shell layer (`appFrame`) with first-class tabs/help/command palette/focus.
- First-party test harness for interaction-level tests.

Avoid:

- Pulling Bijou toward an OOP widget-tree architecture; keep TEA + pure function identity.

## 4) Ink

### Component setup model

- React renderer for terminal. Familiar for React devs.
- Built-ins are intentionally small (`Box`, `Text`, hooks like `useInput`, `useFocus`).
- Rich behavior typically comes from ecosystem packages (`ink-select-input`, `ink-table`, etc.).

### DX strengths

- Extremely approachable if you already know React.
- Flexbox layout via Yoga is familiar.
- Good test path through `ink-testing-library`.

### DX tradeoffs

- Many common components are external dependencies (ecosystem quality variance).
- Large app shells can devolve into hook orchestration and ad hoc conventions.
- Built-in component surface is intentionally lean; not a shell framework by itself.

### Relevant takeaway for Bijou

Copy:

- Declarative composition feel and narrow primitive set that composes well.

Avoid:

- Offloading core shell primitives (`split`, `tabs`, command palette) to third-party ecosystem if we want consistent DX.

## Cross-Stack Summary (What This Means for Bijou)

Bijou currently sits between Bubble Tea and Ratatui in ergonomics:

- More batteries than Ratatui for interactive CLI workflows.
- Less "app shell out of the box" than Textual.
- Stronger first-party component coherence than Ink's third-party-heavy model.

The biggest gap is not low-level capability. The gap is shell-level abstraction density.

## What Other Stacks Do Better Today

1. Built-in "app skeleton" patterns
- Textual: header/footer, command palette, docked panes, CSS layout all integrated.
- Bubble Tea ecosystem: strong list/help/key patterns that appear consistent across apps.

2. First-class help/shortcut ergonomics
- Bubble Tea/Bubbles and Textual both make discoverability (help + bindings) central.

3. Interaction testing harness
- Textual has the strongest first-party story (`run_test` + `Pilot`).
- Ink has an established external testing library.

## What Bijou Already Does Better

1. Graceful degradation is core to design
- Bijou explicitly targets interactive/static/pipe/accessible from one codebase.

2. Pure-function TEA building blocks
- Existing primitives (`focusArea`, input stack, panel group) are composable and test-friendly.

3. Package architecture is simple and coherent
- Core + node adapter + tui runtime are conceptually clear and lock-step versioned.

## Recommendations for Phase 8/9

### A) Implement `splitPane()` as a stateful primitive, not just a renderer

Minimum API shape (proposed):

```ts
interface SplitPaneState {
  ratio: number;           // 0..1
  focused: 'a' | 'b';
}

function createSplitPaneState(opts: {
  ratio?: number;
  minA?: number;
  minB?: number;
}): SplitPaneState;

function splitPane(
  state: SplitPaneState,
  opts: {
    direction: 'row' | 'column';
    width: number;
    height: number;
    paneA: (w: number, h: number) => string;
    paneB: (w: number, h: number) => string;
    divider?: { char?: string; showHandle?: boolean };
  },
): string;
```

And provide pure reducers:

- `splitPaneFocusNext(state)`
- `splitPaneResizeBy(state, delta)`
- `splitPaneHandleKey(state, msg, keyMap?)`

Why: this mirrors the successful pattern already used by `focusArea` and keeps TEA purity.

### B) Make `grid()` constraint-driven (Ratatui-style, simpler vocabulary)

Use tracks like:

- fixed: `12`
- fractional: `'1fr'`, `'2fr'`
- auto (content-based, limited): `'auto'`

Named areas should be first-class for readability in shell pages.

### C) `appFrame()` should own shell concerns end-to-end

`createFramedApp({...})` should provide:

- tab switching
- global keymap + per-page keymap layering
- `?` help overlay (from keymap metadata)
- page-local scroll/pane focus persistence
- optional command palette integration
- default chrome (title/status/help line)

Reuse existing internals:

- `createPanelGroup`
- `createInputStack`
- `createKeyMap`
- `helpShort`/`helpView`

### D) Add first-party app interaction test harness

Not just component tests. Provide a tiny harness for:

- key sequence replay
- resize events
- model/view snapshots over time

This is where Textual is currently ahead in DX confidence.

### E) Expand `drawer()` anchors beyond left/right

Add `top` + `bottom` anchors (alongside left/right) so shell apps can use slide-up/slide-down panels for logs, command output, or context panes.

Why: this is a high-impact UX primitive with low conceptual risk, and it composes naturally with existing `composite()` overlay work.

Also support panel-scoped drawers (drawer attached to a pane rect) instead of limiting drawers to full-screen surfaces.

### F) Add optional page/tab transition animations in `appFrame()`

Support transitions like `wipe`, `dissolve`, `grid`, and `fade` between pages/tabs, implemented with full-screen `canvas()` + `composite()`.

Guardrails:

- Default: `none` (no transition)
- Auto-disable in `static`, `pipe`, and `accessible` modes
- Keep transitions short and interruptible to preserve responsiveness

## Proposed Implementation Sequence (Low-Risk)

1. `splitPane` state + renderer + tests
- start with keyboard-resizable divider and focus switching
- no drag/mouse in v1

2. `grid` with fixed + fr tracks
- add named areas once core solver is stable

3. `appFrame` MVP
- tabs + global/per-page keys + help overlay + scroll isolation

4. `appFrame` advanced
- multipane page composition via `splitPane` / `grid`
- optional command palette bridge

5. test harness package/module
- headless interaction tests for framed apps

## Concrete "copy this, avoid that" checklist

Copy from Bubble Tea/Bubbles:

- key binding metadata as canonical source for help
- discoverable keyboard UX in every complex component

Copy from Ratatui:

- deterministic constraint semantics for layout primitives

Copy from Textual:

- high-level app shell defaults
- first-party interaction testing ergonomics

Copy from Ink:

- declarative composition feel and low ceremony for simple apps

Avoid from all:

- fragmented multi-package shell story
- hidden mutable component state that fights TEA
- requiring app authors to hand-roll focus/scroll/layout glue repeatedly

## Bottom Line
Bijou does not need new low-level power first. It needs a shell abstraction layer that makes the current power easy to compose.

If Phase 8/9 lands with:

- `splitPane` + `grid` as pure, testable stateful primitives
- `appFrame` as a high-level opinionated wrapper over existing building blocks
- a first-party interaction test harness

then Bijou will have a DX profile that is:

- closer to Textual for app scaffolding ergonomics,
- while keeping the TEA purity and degradation strengths that are already distinctive in this repo.

## References (Inspected Files)

Bijou:

- `docs/ROADMAP.md`
- `examples/split-editors/main.ts`
- `examples/command-palette/main.ts`
- `packages/bijou-tui/src/panels.ts`
- `packages/bijou-tui/src/inputstack.ts`
- `packages/bijou-tui/src/focus-area.ts`

Bubble Tea / Bubbles:

- `bubbletea/README.md`
- `bubbletea/examples/split-editors/main.go`
- `bubbletea/examples/help/main.go`
- `bubbles/README.md`

Ratatui:

- `ratatui/README.md`
- `ratatui/ARCHITECTURE.md`
- `ratatui/examples/README.md`
- `ratatui/examples/apps/hello-world/src/main.rs`
- `ratatui/examples/apps/demo/src/*`

Textual:

- `textual/README.md`
- `textual/examples/code_browser.py`
- `textual/examples/code_browser.tcss`
- `textual/docs/guide/testing.md`

Ink:

- `ink/readme.md`
- `ink/examples/router/router.tsx`
- `ink/examples/table/table.tsx`
- `ink/examples/chat/chat.tsx`
