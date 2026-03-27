# bijou Roadmap

> **Tests ARE the Spec.** Every feature is defined by its tests. If it's not tested, it's not guaranteed. Acceptance criteria are written as test descriptions first, implementation second.

Latest published release: **v4.0.0** — Pure Surface Release

Current planning horizon: **post-v4 platform buildout**

---

## Shipped milestones

See [COMPLETED.md](COMPLETED.md) for the full shipped log and completed branch work. The roadmap below contains only unfinished work.

| Version | Milestone | Key deliverables |
|---------|-----------|-----------------|
| v4.0.0 | Pure Surface Release | Pure-surface runtime contract, structured shell/overlay/layout primitives, design-system conformance pass, release/docs hardening |
| v3.1.0 | Surface-First Confidence Release | Surface-first primitives, deterministic clock/runtime seams, frame regressions, shared viewport overlay groundwork, smoke/release hardening, notification system |
| v3.0.0 | Truthful V3 Release | Surface-native runtime path, framed `ViewOutput`, BCSS scope, worker runtime, native recorder, release demos |
| v2.0.0 | Tech Debt Cleanup | Remove process/env fallbacks, eventbus error port, app-frame decomposition |
| v1.8.0 | The Big One | Custom fill chars, constrain, note, timer, dynamic forms, panel minimize/maximize/dock, layout presets |
| v1.7.0 | Test Fortress | Deep audit, multiselect defaultValues, nodeIO/chalkStyle tests, fast-check fuzz suites |
| v1.6.0 | Terminal Whisperer + Test Audit | F-key parsing, cursor manager, underline variants, env accessor refactor, 24-test audit pass |
| v1.5.0 | Polish & Patterns | Mode rendering, test hardening, theme accessors, background-style support pass |
| v1.4.0 | Transitions & Showcase | Tab transition animations, interactive showcase app, scrollable multiselect |
| v1.3.0 | App Shell Foundations | `splitPane()`, `grid()`, `createFramedApp()`, drawer expansion, scrollable `select()`, `bijou-tui-app`, `create-bijou-tui-app` |

### Component catalog

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

## Triage order

The next phase is deliberately narrower than the v4 release branch. Priority order:

1. **DOGFOOD** — establish the shared content and story substrate before building more one-off examples.
2. **Replay and deterministic DX** — make Bijou uniquely inspectable, recordable, and testable.
3. **Platform hardening and release hygiene** — keep the release/test/tooling base honest while the platform grows.
4. **Runtime and design-system expansion** — push richer primitives once the substrate above is in place.
5. **Ecosystem and long-range bets** — ambitious adapters and studios after the core platform story is coherent.

---

## DOGFOOD

See [docs/strategy/dogfood.md](strategy/dogfood.md) for the design-thinking rationale, primary user, jobs to be done, principles, and recommended first slice.

| Feature | Package | Notes |
|---------|---------|-------|
| **Story Protocol** | docs + examples + repo tooling | Highest-priority post-v4 foundation. Define structured `ComponentStory` and `PatternStory` records that can power docs pages, showcase entries, smoke scenarios, replay artifacts, and regression captures from one source of truth instead of duplicating example logic across the repo. Initial design captured in [ComponentStory v0](strategy/component-story-v0.md) and [Story Protocol spec](specs/story-protocol.spec.json). |
| **Bijou Docs TUI** | docs + bijou-tui-app | Build a VitePress-like docs application in Bijou itself, with left-nav docs, live component demos, source panes, width/theme toggles, and `rich` / `static` / `pipe` / `accessible` profile switching. Long-term goal: make this the primary human-facing docs surface and retire most ad hoc example READMEs. |
| **Shell-Owned Settings Drawer** | bijou-tui + docs | Add a standard left-edge settings drawer to `createFramedApp()` so framed apps can expose global preferences without inventing one-off overlays. The first proving surface should be DOGFOOD, with shell-level preferences like landing theme, profile default, animation, and hint visibility. Initial design captured in [Settings Belong to the Shell](strategy/settings-belong-to-the-shell.md) and [Frame Settings Drawer spec](specs/frame-settings-drawer.spec.json). |
| **Surface Selector Model** | bijou + bijou-tui + repo tooling | Add semantic selectors over surfaces and layout output (`id`, `class`, role-like tags, pane scope, text contains) so docs demos, scenario tests, and devtools can target UI meaningfully instead of falling back to frame coordinates or brittle string searches. |
| **Surface Scenario Test Harness** | repo tooling + bijou-tui | Build a Playwright-like test/runtime harness for Bijou surfaces with semantic selectors, scripted input driving, frame assertions, deterministic interaction flows, and integrated recording/playback hooks. If the API stabilizes, this likely graduates into its own package rather than staying as repo-local tooling. |
| **Interaction Profile Simulator** | bijou-tui + docs | Add a built-in simulator that can flip a surface or app among `rich`, `static`, `pipe`, `accessible`, reduced-motion, no-color, and narrow-width profiles so graceful-lowering behavior can be tested and taught without bespoke demo wiring. |
| **Component Lab Mode** | docs + bijou-tui-app | Replace isolated knob-heavy demos with one story-driven lab surface inside the docs app. The lab should share stories, selectors, and scenarios instead of inventing its own parallel control model. |
| **FTUI Onboarding Primitives** | bijou-tui + docs | Build first-time-user-experience components for guided onboarding: tutorial overlays that temporarily block unrelated input, spotlight/popover flows that dim everything except the target surface, stepper-style bottom guidance with skip/dismiss controls, and game-like interactive tutorials that can teach shell navigation inside a real app. |
| **The Humane Shell** | bijou-tui + docs | Refine `createFramedApp()` into a more intentional human-facing product shell: concise header, operational footer, search/help/settings discoverability, shell-owned quit policy, clearer confirmation flows, and a future notification-history surface. DOGFOOD should remain the first proving surface. Initial strategy captured in [The Humane Shell](strategy/humane-shell.md), with notification review now split into [Notification History Belongs to the Shell](strategy/notification-history-belongs-to-the-shell.md). |

## Milestone 2 — Replay, Debugging, and Deterministic DX

| Feature | Package | Notes |
|---------|---------|-------|
| **Replay Artifact Pipeline** | repo tooling + bijou-tui + git tooling | Capture deterministic run artifacts that bundle surface frames, scripted input, timing, runtime metadata, and git/worktree provenance so failures can be replayed later. Explore using a dedicated git-backed scratch repo plus git-warp-style time travel/reconstruction to package and replay these runs as portable zipped artifacts. |
| **Semantic Recording Layer** | bijou-tui + repo tooling | Record not just frames, but also messages, commands, focus/input-stack transitions, notifications, route changes, and other semantic runtime events so replay/debugging can answer why the UI changed, not only what it looked like. |
| **Scenario Pack Format** | repo tooling + docs | Define portable scenario bundles that can package initial state, scripted inputs, assertions, expected frames, and optional replay artifacts, so docs demos, bug repros, CI tests, and local debugging can share one transport format. |
| **Surface Replay Viewer** | repo tooling + docs | Build a frame scrubber for recorded `Surface[]` sessions and replay artifacts so demos and bugs can be inspected interactively instead of only exported as GIFs. This should evolve into a time-travel viewer with frame stepping, input scrubbing, and model/runtime state inspection. |
| **Bijou DevTools Inspector** | bijou-tui | Expand the toggleable overlay into a real inspector for focused node ids/classes, layout rects, BCSS matches, token resolution, message flow, focus ownership, and runtime state, with direct links into replay/debug tooling. |
| **Layout Debugger Overlay** | bijou-tui | Add an opt-in debugging layer that renders gutters, split ratios, viewport bounds, mask extents, and flex/grid allocation details directly over the app so layout tuning becomes visible and explainable. |
| **Token Graph / Theme Explorer** | docs + repo tooling | Add an interactive explorer that visualizes semantic token resolution, references, fallbacks, live preset swaps, and BCSS token lookups so theme/debug work becomes inspectable instead of inferential. |

## Milestone 3 — Platform Hardening and Release Hygiene

| Feature | Package | Notes |
|---------|---------|-------|
| **Shared Runtime Viewport Overlay** | bijou-tui + bijou-node | Finish extracting the mutable runtime-size overlay used by the main runtime and worker runtime into one shared helper so resize-state logic stays consistent across contexts. |
| **Deterministic Time & Idle Semantics** | bijou + bijou-tui | The first hardening slice shipped a shared `clock` port, `mockClock()`, event-bus `drain()`, and pulse-driven timing. Remaining work is the last global-timer holdouts plus more defensive interval/microtask/sentinel regressions. |
| **Worker Runtime Hardening & Performance** | bijou-node | `runInWorker()` / `startWorkerApp()` shipped already. Remaining work is heavier-load scheduling, profiling, and cleanup beyond the first release. |
| **Render, Layout, and Worker Benchmarks** | repo tooling + bijou-tui + bijou-node | Add a small benchmark suite for diff rendering, layout solves, recorder throughput, and worker round-trips so performance regressions are measured instead of guessed. |
| **Deterministic Snapshot Replay & Assertions** | bijou-tui | Build replay/assert APIs for deterministic UI tests, not just demo capture, on top of the surface-native runtime and recorder stack. |
| **Deterministic Visual Regression Suite** | bijou-tui + bijou-node | Build frame-level golden tests on top of `Surface[]` capture so visual regressions can be detected without screenshot diff flake. |
| **String/Surface Parity Regression Harness** | bijou + repo tooling | Add a reusable regression pattern for paired string/surface component APIs so option parity, width normalization, and render-policy separation stay locked in. |
| **Wide-Cell Surface Support** | bijou + bijou-tui | Replace the current placeholder-cell strategy with a first-class wide-cell model so surface composition, overlays, and diff rendering handle double-width glyphs as a real primitive instead of a workaround. |
| **Shell Overlay Exclusivity Regression Helpers** | bijou-tui + repo tooling | Add shared regressions for shell-owned overlays so command palette, help, and future shell modals consistently shield page input and mouse routing. |
| **Focus Owns Input** | bijou-tui | Build pane-scoped input ownership into `createFramedApp()` so the focused pane owns local keyboard and mouse controls, inactive panes stop responding, and the help surface reflects the active area instead of stale page-global bindings. Initial design captured in [Focus Owns Input](strategy/focus-owns-input.md) and [Focused Pane Input spec](specs/focused-pane-input.spec.json). |
| **PR Reviewability Guard** | repo tooling | Warn when a branch exceeds automated-review limits or becomes a monolithic PR that bots and humans cannot realistically review well. |
| **PR Review Tooling** | repo tooling | `pr:review-status` and `pr:merge-readiness` shipped. Remaining work is differentiating active bot-review progress from stale historical chatter, shared GitHub adapter helpers, and batch reply/resolve workflows for addressed threads. |
| **Smoke Harness Unit Coverage** | repo tooling | Add focused tests for `scripts/smoke-all-examples.ts`, especially path/root resolution and launcher selection, so portability regressions fail before CI smoke runs. |
| **PTY Lifecycle Race Coverage** | repo tooling + scripts | Add regression coverage for resize/exit ordering and other late-step shutdown races so the PTY harness keeps its lifecycle guarantees explicit. |
| **Worker Proxy Test Optimization** | bijou-node | Keep the host-to-worker viewport coverage healthy while trimming dynamic import/mock overhead so the test can get cheaper again. |
| **GitHub Actions Runtime Compatibility** | repo tooling | Keep workflow action majors current so CI/publish/dry-run paths stay ahead of runner-runtime deprecations. |
| **Release Dry-Run Workflow** | repo tooling | Keep local and remote release checks in sync, especially around release-note generation, publish policy, and artifact verification. |
| **Scaffold Canary in CI** | repo tooling + create-bijou-tui-app | Keep the generated TUI canary and published-artifact path healthy on every release candidate. |
| **Packed Scaffold CLI Test Optimization** | create-bijou-tui-app | Keep the packed bin-shim integration test truthful while continuing to reduce install/pack overhead in the full suite. |
| **Python Script Artifact Hygiene** | repo tooling | Bytecode suppression and `.gitignore` backstop shipped. Remaining work is keeping the PTY helper self-contained and low-noise. |
| **Low-Allocation Renderer** | bijou + bijou-tui + bijou-node | Move the runtime toward reusable framebuffers and a low-garbage hot render loop: front/back buffer reuse first, direct-cell diffing second, and only then a possible internal mutable framebuffer type if benchmarks still justify it. Initial design captured in [Low-Allocation Renderer](strategy/low-allocation-renderer.md). |

## Milestone 4 — Runtime and Design-System Expansion

| Feature | Package | Notes |
|---------|---------|-------|
| **Rich Canvas / Shader v2** | bijou-tui | Upgrade `canvas()` to support rich cell output (`{ char, color, bg }`), normalized UV mapping, and high-res Braille/Quad sub-grid scaling. |
| **BCSS Global Cascade & Live Styles** | bijou-tui | v4 ships a much stronger surface-native runtime path. Remaining work is a broader layout-node cascade, live style reload tooling, and clearer inspection of selector resolution. |
| **Standardized `BijouNode` Protocol** | bijou | Unify node shape and `children` semantics across components for stronger composability and richer story/render tooling. |
| **Standard Interactive Component & Form System** | bijou-tui | Create a unified interface for stateful components, global focus management, and TEA-native form binding. |
| **Row-Aware Table Viewport Model** | bijou-tui | `navigableTableSurface()` now keeps keyboard-owned table inspection on the structured surface path. Remaining work is deciding whether wrapped-row comparison deserves a reusable row-aware masked-table primitive beyond the local implementation. |
| **Notification Center / History View** | bijou-tui | Build on the shipped notification stack with a reusable archive view, command-palette entry points, filters, and richer review/reopen flows. Initial design captured in [Notification History Belongs to the Shell](strategy/notification-history-belongs-to-the-shell.md) and [Shell Notification Center](specs/shell-notification-center.spec.json). |
| **Data Visualization Suite** | bijou | High-density `sparkline()`, `barChart()`, and Braille-based `scatterPlot()` for real-time monitoring. |
| **Motion API** | bijou-tui | Declarative entry/exit animations for components in the `view` function. |
| **Syntax-Aware `textarea`** | bijou | Lightweight syntax highlighting for JSON, YAML, and Markdown within the editor. |
| **Shell Doctrine Linter** | repo tooling + docs | Add an opinionated linter that flags shell/design-system misuse such as tabs used as command buttons, status bars carrying prose, ad hoc toasts where notifications belong, or component families missing the required use/avoid/lowering docs. |
| **Pluggable "Effect" Handlers** | bijou | Formalize `HttpPort`, `SqlPort`, and `GitPort` to keep side effects mockable and testable. |

## Milestone 5 — Ecosystem and Long-Range Bets

| Feature | Package | Notes |
|---------|---------|-------|
| **Bijou Story Studio** | docs + bijou-tui-app | Build a Storybook-like workbench for Bijou stories with isolated component/pattern stories, knobs/controls, mode switching, source panes, visual regression hooks, and scenario export. |
| **Bijou Studio** | docs + repo tooling + future app package | Explore a Figma-like visual composition environment for Bijou where surfaces, layout regions, tokens, motion, and component stories can be arranged visually, then exported back into story definitions, layout code, or replayable scenario artifacts. |
| **bijou-web** | adapters | Implement `WebRuntime` and `WebIO` adapters to run Bijou TUIs in the browser (Wasm/Xterm.js). |
| **Continuum Bridge** | bijou | Specialized `ContinuumPort` for live-syncing components with WARP graphs and Shiplog events. |

---

## What changed in this triage

- `v4.0.0` is no longer treated as “in flight”; it is now a shipped release.
- Release-blocker items were either moved to [COMPLETED.md](COMPLETED.md), folded into platform hardening, or dropped if they were no longer real backlog.
- The top of the roadmap now reflects the deliberate post-v4 sequence:
  1. DOGFOOD
  2. replay/debugging substrate
  3. hardening and release hygiene
  4. runtime/design-system expansion
  5. ecosystem bets
