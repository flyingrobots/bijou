# bijou Roadmap

> **Tests ARE the Spec.** Every feature is defined by its tests. If it's not tested, it's not guaranteed. Acceptance criteria are written as test descriptions first, implementation second.

Latest release: **v3.1.0** — Surface-First Confidence Release

Next target: **v4.0.0** — Pure Surface Release

---

## Shipped milestones

See [COMPLETED.md](COMPLETED.md) for the full shipped log and completed branch work. The roadmap below contains only unfinished work.

| Version | Milestone | Key deliverables |
|---------|-----------|-----------------|
| v3.1.0 | Surface-First Confidence Release | Surface-first primitives, deterministic clock/runtime seams, frame regressions, shared viewport overlay groundwork, smoke/release hardening, notification system |
| v3.0.0 | Truthful V3 Release | Surface-native runtime path, framed `ViewOutput`, BCSS scope, worker runtime, native recorder, release demos |
| v2.0.0 | Tech Debt Cleanup | Remove process.env fallbacks, eventbus error port, app-frame decomposition |
| v1.8.0 | The Big One | Custom fill chars, constrain, note, timer, dynamic forms, panel minimize/maximize/dock, layout presets |
| v1.7.0 | Test Fortress | Deep audit, multiselect defaultValues, nodeIO/chalkStyle tests, fast-check fuzz suites |
| v1.6.0 | Terminal Whisperer + Test Audit | F-key parsing, cursor manager, underline variants, env accessor refactor, 24-test audit pass |
| v1.5.0 | Polish & Patterns | Mode rendering (OCP), test hardening, theme accessors (DIP), style pass (bg support for 7 components) |
| v1.4.0 | Transitions & Showcase | Tab transition animations (7 shaders), interactive showcase app, scrollable multiselect |
| v1.3.0 | App Shell Foundations | `splitPane()`, `grid()`, `createFramedApp()`, drawer expansion, scrollable `select()`, `bijou-tui-app`, `create-bijou-tui-app` |
| v1.0.0 | Architecture Audit | ISP port segregation, form DRY extraction, background color support |
| v0.10.x | Canvas, Mouse, Box Width | `canvas()` shader, SGR mouse, `box({ width })`, JSDoc total coverage |
| v0.6.0–v0.9.0 | Component Library | Forms, navigation, data, overlays, TUI building blocks, color manipulation, markdown, hyperlinks, grapheme support |
| v0.2.0 | Hexagonal Architecture | Port system, viewport, keybindings, help generator |

### Component catalog (complete)

| Category | Components |
|----------|-----------|
| **Element** | `alert()`, `badge()`, `separator()`, `skeleton()`, `kbd()` |
| **Data** | `accordion()`, `tree()`, `timeline()`, `dag()`, `dagSlice()`, `dagLayout()`, `dagStats()` |
| **Forms** | `input()`, `select()`, `multiselect()`, `confirm()`, `group()`, `textarea()`, `filter()`, `wizard()` |
| **Navigation** | `tabs()`, `breadcrumb()`, `paginator()`, `stepper()`, `commandPalette()` |
| **TUI Building Blocks** | `viewport()`, `pager()`, `interactiveAccordion()`, `createPanelGroup()`, `navigableTable()`, `browsableList()`, `filePicker()`, `focusArea()`, `dagPane()` |
| **Overlay** | `composite()`, `modal()`, `toast()`, `drawer()`, `tooltip()` |
| **Input** | `parseKey()`, `createKeyMap()`, `createInputStack()`, `parseMouse()` |
| **Layout** | `splitPane()`, `grid()`, `flex()`, `place()`, `vstack()`, `hstack()` |
| **App** | `statusBar()`, `createFramedApp()`, `canvas()` |

---

## Current target: v4.0.0 — Pure Surface Release

Branch: `feat/v4-pure-v3-release`

Release intent:
- finish the last string-era teaching seams in `bijou-tui`
- finish the remaining surface-native collection and pane paths, using `viewportSurface()` where it fits and row-aware scrolling where it does not
- make the design-system docs good enough to be a real standard, not just a shape check
- keep scaffold, smoke, and release workflows truthful enough to publish without hand-waving

### Milestone 1 — Publish blockers

| Feature | Package | Notes |
|---------|---------|-------|
| **Design-System Documentation Completeness** | docs | The component-family guide now has a structural completeness gate in CI (`docs:design-system:preflight`). Remaining work is deeper content guidance, stronger examples, and sharper edge-case policy. |
| **Component Guidance & Carbon-Style Usage Docs** | docs + examples + package READMEs | Keep expanding the “what this is / variants / use / avoid / graceful lowering / related families” doctrine until the public docs actually support the design system they claim to describe. |
| **Scaffold Canary in CI** | repo tooling + create-bijou-tui-app | Keep the generated TUI canary and published-artifact path healthy on every release candidate. |
| **Packed Scaffold CLI Test Optimization** | create-bijou-tui-app | Keep the packed bin-shim integration test truthful while continuing to reduce install/pack overhead in the full suite. |
| **Workflow Shell Preflight** | repo tooling | Add a lightweight local command that validates workflow shell blocks and release-policy snippets outside GitHub Actions. |
| **GitHub Actions Runtime Compatibility** | repo tooling | Keep workflow action majors current so CI/publish/dry-run paths stay ahead of runner-runtime deprecations. |
| **Release Dry-Run Workflow** | repo tooling | The shared validation path shipped already; remaining work is to keep local and remote release checks in sync and tighten policy coverage before the v4 publish. |

### Milestone 2 — Platform hardening after v4 publish

| Feature | Package | Notes |
|---------|---------|-------|
| **Shared Runtime Viewport Overlay** | bijou-tui + bijou-node | Finish extracting the mutable runtime-size overlay used by the main runtime and worker runtime into one shared helper so resize-state logic stays consistent across contexts. |
| **Deterministic Time & Idle Semantics** | bijou + bijou-tui | The first v3.1 hardening slice shipped a shared `clock` port, `mockClock()`, event-bus `drain()`, and pulse-driven timing. Remaining work is the last global-timer holdouts plus more defensive interval/microtask/sentinel regressions. |
| **Worker Runtime Hardening & Performance** | bijou-node | `runInWorker()` / `startWorkerApp()` shipped in v3.0.0. Remaining work is heavier-load scheduling, profiling, and cleanup beyond the first release. |
| **Render, Layout, and Worker Benchmarks** | repo tooling + bijou-tui + bijou-node | Add a small benchmark suite for diff rendering, layout solves, recorder throughput, and worker round-trips so performance regressions are measured instead of guessed. |
| **Deterministic Snapshot Replay & Assertions** | bijou-tui | The native Surface-to-GIF recorder shipped in v3.0.0. Remaining work is replay/assert APIs for deterministic UI tests, not just demo capture, plus a stable replay-artifact format that can bundle captured surfaces, input scripts, timing, and build metadata for later inspection or CI triage. |
| **Deterministic Visual Regression Suite** | bijou-tui + bijou-node | Build frame-level golden tests on top of `Surface[]` capture so visual regressions can be detected without screenshot diff flake. |
| **Worker Proxy Test Optimization** | bijou-node | Keep the host-to-worker viewport coverage added in v3.0.0. Remaining work is trimming dynamic import/mock overhead so the test can get cheaper again. |
| **String/Surface Parity Regression Harness** | bijou + repo tooling | Add a reusable regression pattern for paired string/surface component APIs so option parity, width normalization, and render-policy separation stay locked in. |

### Milestone 3 — Design system and runtime expansion

| Feature | Package | Notes |
|---------|---------|-------|
| **Rich Canvas / Shader v2** | bijou-tui | Upgrade `canvas()` to support rich cell output (`{ char, color, bg }`), normalized UV mapping, and high-res Braille/Quad sub-grid scaling. |
| **BCSS Global Cascade & Live Styles** | bijou-tui | v3.0.0 ships scoped BCSS for supported V3 surface components and frame shell regions. Remaining work is a broader layout-node cascade and live style reload tooling. |
| **Standardized `BijouNode` Protocol** | bijou | Unified node type and `children` prop across all components for true composability. |
| **Standard Interactive Component & Form System** | bijou-tui | Unified interface for stateful components, global focus management, and TEA-native form binding. |
| **Row-Aware Table Viewport Model** | bijou-tui | `navigableTableSurface()` now keeps keyboard-owned table inspection on the structured surface path. Remaining work is deciding whether wrapped-row comparison deserves a reusable row-aware masked-table primitive beyond the local navigable-table implementation. |
| **Notification Center / History View** | bijou-tui | Build on the shipped notification stack with a reusable archive view, command-palette entry points, filters, and richer review/reopen flows. |
| **Data Visualization Suite** | bijou | High-density `sparkline()`, `barChart()`, and Braille-based `scatterPlot()` for real-time monitoring. |
| **Motion API** | bijou-tui | Declarative entry/exit animations (Framer Motion style) for components in the `view` function. |
| **Syntax-Aware `textarea`** | bijou | Lightweight syntax highlighting for JSON, YAML, and Markdown within the editor. |
| **Surface Replay Viewer** | repo tooling + docs | Build a frame scrubber for recorded `Surface[]` sessions and replay artifacts so demos and bugs can be inspected interactively instead of only exported as GIFs. |
| **Bijou DevTools Inspector** | bijou-tui | Expand the toggleable overlay into a real inspector for focused node ids/classes, layout rects, BCSS matches, token resolution, message flow, and runtime state. |

### Milestone 4 — Tooling, ecosystem, and long-range bets

| Feature | Package | Notes |
|---------|---------|-------|
| **PR Review Tooling** | repo tooling | `pr:review-status` and `pr:merge-readiness` shipped. Remaining work is differentiating active bot-review progress from stale historical chatter, shared GitHub adapter helpers, and batch reply/resolve workflows for addressed threads. |
| **Surface Scenario Test Harness** | repo tooling + bijou-tui | Build a Playwright-like test/runtime harness for Bijou surfaces with semantic selectors, scripted input driving, frame assertions, and deterministic interaction flows so docs demos, scenario tests, and regressions can all share one DX layer. If the API stabilizes, this likely graduates into its own package rather than staying as repo-local tooling. |
| **Replay Artifact Pipeline** | repo tooling + bijou-tui + git tooling | Capture deterministic run artifacts that bundle surface frames, scripted input, timing, runtime metadata, and git/worktree provenance so failures can be replayed later. Explore using a dedicated git-backed scratch repo plus git-warp-style time travel/reconstruction to package and replay these runs as portable zipped artifacts. |
| **Smoke Harness Unit Coverage** | repo tooling | Add focused tests for `scripts/smoke-all-examples.ts`, especially path/root resolution and launcher selection, so portability regressions fail before CI smoke runs. |
| **PTY Lifecycle Race Coverage** | repo tooling + scripts | Add regression coverage for resize/exit ordering and other late-step shutdown races so the PTY harness keeps its lifecycle guarantees explicit. |
| **Python Script Artifact Hygiene** | repo tooling | Bytecode suppression and `.gitignore` backstop shipped. Remaining work is keeping the PTY helper self-contained and low-noise. |
| **Pluggable "Effect" Handlers** | bijou | Formalize `HttpPort`, `SqlPort`, and `GitPort` to keep side effects mockable and testable. |
| **bijou-web** | adapters | Implement `WebRuntime` and `WebIO` adapters to run Bijou TUIs in the browser (Wasm/Xterm.js). |
| **Continuum Bridge** | bijou | Specialized `ContinuumPort` for live-syncing components with WARP graphs and Shiplog events. |
| **Token Graph / Theme Explorer** | examples + docs | Add an interactive explorer that visualizes semantic token resolution, references, fallbacks, and live preset swaps. |
| **Layout Debugger Overlay** | bijou-tui | Add an opt-in debugging layer that renders gutters, split ratios, viewport bounds, and flex remainder allocation to make layout tuning faster. |
| **Component Lab Mode** | examples + bijou-tui-app | Build a knob-driven playground for components and scripted scenarios so examples can share one interactive lab instead of each demo hand-rolling controls. |
