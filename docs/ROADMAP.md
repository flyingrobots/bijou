# bijou Roadmap

> **Tests ARE the Spec.** Every feature is defined by its tests. If it's not tested, it's not guaranteed. Acceptance criteria are written as test descriptions first, implementation second.

Latest: **v3.0.0** — Truthful V3 Release

---

## Shipped milestones

See [COMPLETED.md](COMPLETED.md) for the full shipped log. Summary:

| Version | Milestone | Key deliverables |
|---------|-----------|-----------------|
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
| v0.6.0–v0.9.0 | Component Library | All forms, navigation, data, overlay, TUI building blocks, color manipulation, markdown, hyperlinks, grapheme support |
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

## Backlog

### P1 — Architecture & Performance

| Feature | Package | Notes |
|---------|---------|-------|
| ~~**Programmable Rendering Pipeline**~~ | ~~bijou-tui~~ | ~~Shipped in v3.0.0. Multi-stage pipeline (Layout -> Paint -> Post-Process -> Diff -> Output).~~ |
| ~~**Buffered Surfaces & Post-Processing**~~ | ~~bijou-tui~~ | ~~Shipped in v3.0.0. Render to 2D `Surface` objects. Supported `blit()` transfers, masking, and affine transforms.~~ |
| ~~**Cell-Diffing Render Engine**~~ | ~~bijou-tui~~ | ~~Shipped in v3.0.0. Only sends changed cells and cursor movements to the TTY.~~ |
| ~~**Unified Animation Heartbeat**~~ | ~~bijou-tui~~ | ~~Shipped in v3.0.0. Centralized `PulseMsg` in the EventBus, synchronized to environment refresh rate.~~ |
| ~~**Decoupled Layout Pass**~~ | ~~bijou-tui~~ | ~~Shipped in v3.0.0. `calculateFlex()` returns pure geometry (`LayoutNode`/`LayoutRect`).~~ |
| ~~**EventBus Middleware**~~ | ~~bijou-tui~~ | ~~Shipped in v3.0.0. `bus.use()` interceptor chain added.~~ |
| ~~**Sub-App Composition**~~ | ~~bijou-tui~~ | ~~Shipped in v3.0.0. Fractal TEA support via `mount()` and `mapCmds()`.~~ |
| ~~**Reactive & Semantic Token Graph**~~ | ~~bijou~~ | ~~Shipped in v3.0.0. Reactive graph backend for theming (`createTokenGraph`).~~ |
| **Shared Runtime Viewport Overlay** | bijou-tui + bijou-node | Extract the mutable runtime-size overlay used by the main runtime and worker runtime into one shared helper so resize-state logic stays consistent across contexts. |
| **Standardized `BijouNode` Protocol** | bijou | Unified node type and `children` prop across all components for true composability. |
| **Standard Interactive Component & Form System** | bijou-tui | Unified interface for stateful components (Sub-Apps), global focus management, and TEA-native form binding. |
| **Worker Runtime Hardening & Performance** | bijou-node | `runInWorker()` / `startWorkerApp()` shipped in v3.0.0. Backlog now covers heavier-load scheduling, profiling, and follow-up cleanup beyond the first release. |
| **Render, Layout, and Worker Benchmarks** | repo tooling + bijou-tui + bijou-node | Add a small benchmark suite for diff rendering, layout solves, recorder throughput, and worker round-trips so performance regressions are measured instead of guessed. |
| **Pluggable "Effect" Handlers** | bijou | Formalize `HttpPort`, `SqlPort`, and `GitPort` to keep all side effects mockable and testable. |
| **bijou-web** | adapters | Implement `WebRuntime` and `WebIO` adapters to run Bijou TUIs in the browser (Wasm/Xterm.js). |
| **Deterministic Snapshot Replay & Assertions** | bijou-tui | The native Surface-to-GIF recorder shipped in v3.0.0. Backlog now covers replay/assert APIs for deterministic UI tests, not just demo capture. |
| **Deterministic Visual Regression Suite** | bijou-tui + bijou-node | Build frame-level golden tests on top of `Surface[]` capture so visual regressions can be detected without screenshot diff flake. |
| **Surface-First Primitive Migration** | bijou + bijou-tui | Replace the remaining high-friction string-era display helpers with surface-native equivalents so downstream apps stop tripping over `Surface`/string compatibility seams. |
| **Rich Canvas / Shader v2** | bijou-tui | Upgrade `canvas()` to support rich cell output (`{ char, color, bg }`), normalized UV mapping, and high-res Braille/Quad sub-grid scaling. |
| **BCSS Global Cascade & Live Styles** | bijou-tui | v3.0.0 ships scoped BCSS for supported V3 surface components and frame shell regions. Backlog covers a broader layout-node cascade and live style reload tooling. |

### P2 — Advanced Components & DX

| Feature | Package | Notes |
|---------|---------|-------|
| **Data Visualization Suite** | bijou | High-density `sparkline()`, `barChart()`, and Braille-based `scatterPlot()` for real-time monitoring. |
| **Bijou DevTools Inspector** | bijou-tui | Expand the toggleable overlay (`F12`) into a real inspector for focused node ids/classes, layout rects, BCSS matches, token resolution, message flow, and runtime state. |
| **Syntax-Aware `textarea`** | bijou | Light-weight syntax highlighting for JSON, YAML, and Markdown within the editor. |
| **Motion API** | bijou-tui | Declarative entry/exit animations (Framer Motion style) for components in the `view` function. |
| **Continuum Bridge** | bijou | Specialized `ContinuumPort` for live-syncing components with WARP graphs and Shiplog events. |
| **Scaffold Canary in CI** | repo tooling + create-bijou-tui-app | Generate a fresh app in CI, install dependencies, build it, and smoke-run it once so the scaffolder is validated as a first-class published artifact. |
| **PR Review Tooling** | repo tooling | Add local scripts to summarize unresolved threads, checks, and bot status, plus batch reply/resolve addressed review threads. |
| **Release Dry-Run Workflow** | repo tooling | Add a workflow-dispatch release rehearsal that exercises the publish matrix and release notes flow without touching registries. |
| **Smoke Harness Unit Coverage** | repo tooling | Add focused tests for `scripts/smoke-all-examples.ts`, especially path/root resolution and launcher selection, so portability regressions fail before CI smoke runs. |
| **Surface Replay Viewer** | repo tooling + docs | Build a frame scrubber for recorded `Surface[]` sessions so demos and bugs can be inspected interactively instead of only exported as GIFs. |
| **Worker Proxy Test Optimization** | bijou-node | Keep the host-to-worker viewport coverage added in v3.0.0, but reduce the runtime cost of the worker proxy regression tests. |

### P3 — Nice to have

| Feature | Package | Notes |
|---------|---------|-------|
| **Token Graph / Theme Explorer** | examples + docs | Add an interactive explorer that visualizes semantic token resolution, references, fallbacks, and live preset swaps so the theme graph becomes easier to understand and debug. |
| **Layout Debugger Overlay** | bijou-tui | Add an opt-in debugging layer that renders gutters, split ratios, viewport bounds, and flex remainder allocation to make shell/layout tuning faster. |
| **Component Lab Mode** | examples + bijou-tui-app | Build a knob-driven playground for components and scripted scenarios so examples can share one interactive “lab” instead of each demo hand-rolling controls. |
| ~~**Timer / Stopwatch**~~ | ~~bijou~~ | ~~Shipped in v1.8.0.~~ |
| ~~**MaxWidth / MaxHeight**~~ | ~~bijou~~ | ~~Shipped in v1.8.0 as `constrain()`.~~ |
| ~~**Dynamic forms**~~ | ~~bijou~~ | ~~Shipped in v1.8.0 (wizard transform/branch).~~ |
| ~~**Custom fill chars**~~ | ~~bijou~~ | ~~Shipped in v1.8.0.~~ |
| ~~**Note field**~~ | ~~bijou~~ | ~~Shipped in v1.8.0.~~ |
| ~~**Dockable panel manager (drag + keyboard move)**~~ | ~~bijou-tui~~ | ~~Shipped in v1.8.0 (keyboard move; mouse drag deferred).~~ |
| ~~**Panel minimize/fold/unfold**~~ | ~~bijou-tui~~ | ~~Shipped in v1.8.0.~~ |
| ~~**Panel maximize/restore**~~ | ~~bijou-tui~~ | ~~Shipped in v1.8.0.~~ |
| ~~**Layout presets + session restore**~~ | ~~bijou-tui~~ | ~~Shipped in v1.8.0.~~ |
| ~~**CodeRabbit review exclusions**~~ | ~~repo config~~ | ~~Shipped in v1.7.0.~~ |
| ~~**Git hooks (pre-commit + pre-push)**~~ | ~~repo config~~ | ~~Shipped in v1.7.0.~~ |

---

## ~~Test coverage spec~~ (shipped in v1.7.0)

~~Detailed acceptance criteria for existing features.~~ All sections audited, gaps filled, fuzz suites added. See COMPLETED.md.

### 1. Form functions: confirm, input, select, multiselect

**User story:** As a CLI author, I want to prompt users for input using styled, accessible form controls that degrade gracefully in non-interactive environments.

**Requirements:**
- All four functions work across output modes: `rich`, `pipe`, `accessible`
- Interactive (rich TTY): arrow-key navigation, real-time rendering
- Non-interactive fallback: numbered list selection, line-buffered input
- `NO_COLOR` strips styling but preserves functionality
- Validation errors display inline and re-prompt
- Ctrl+C cancellation returns a consistent signal
- Default values are pre-selected and skippable with Enter

**Acceptance criteria:**

```text
confirm()
  rich mode
    ✓ renders yes/no prompt with default highlighted
    ✓ accepts y/Y/yes → true
    ✓ accepts n/N/no → false
    ✓ Enter with no input returns default value
    ✓ invalid input re-prompts
  pipe mode
    ✓ reads a single line from stdin
    ✓ returns default when stdin is empty
  accessible mode
    ✓ renders plain text prompt without box decorations
    ✓ labels clearly indicate expected input (yes/no)
  NO_COLOR
    ✓ prompt renders without ANSI escape codes
    ✓ functionality identical to colored mode

input()
  rich mode
    ✓ renders prompt with placeholder text
    ✓ captures typed input and returns trimmed string
    ✓ required: true rejects empty input with message
    ✓ custom validator receives input and can return error string
    ✓ validation error clears and re-renders prompt
  pipe mode
    ✓ reads a single line from stdin
    ✓ applies validation to piped input
    ✓ returns default when stdin is empty and default is set
  edge cases
    ✓ very long input (>1000 chars) doesn't corrupt rendering
    ✓ multi-byte unicode input (emoji, CJK) handled correctly

select()
  rich mode
    ✓ renders option list with cursor on first item (or default)
    ✓ arrow up/down moves cursor with wrap-around
    ✓ Enter selects highlighted option and returns its value
    ✓ option list scrolls when exceeding terminal height
  non-interactive fallback
    ✓ renders numbered list
    ✓ accepts number input and returns corresponding value
    ✓ invalid number re-prompts
    ✓ default value indicated in prompt
  pipe mode
    ✓ reads value from stdin line
    ✓ matches against option values
    ✓ returns default when stdin is empty

multiselect()
  rich mode
    ✓ renders option list with checkboxes
    ✓ Space toggles selection on current item
    ✓ Enter confirms and returns array of selected values
    ✓ pre-selected defaults are checked on initial render
    ✓ arrow keys navigate with wrap-around
  non-interactive fallback
    ✓ renders numbered list
    ✓ accepts comma-separated numbers
    ✓ validates all numbers are in range
  pipe mode
    ✓ reads comma-separated values from stdin
    ✓ returns empty array when stdin is empty

all forms
  ✓ Ctrl+C cancels gracefully — confirm/input reject with error, select returns default/first value, multiselect returns empty array
  ✓ each form accepts ctx parameter and uses it over default
  ✓ each form works with createTestContext() and mock IO
```

**Test plan:**
- **Golden path:** one happy-path test per mode per function using `createTestContext()` with pre-queued answers via `mockIO()`
- **Failure modes:** invalid input, empty input, validation rejection, cancellation
- **Fuzz/stress:** randomized input strings (unicode, control chars, very long), rapid repeated calls

---

### 2. Factory and context management

**User story:** As a library consumer, I want `createBijou()` to wire up ports into a working context, and the default context singleton to let me skip passing `ctx` everywhere.

**Requirements:**
- `createBijou()` accepts port implementations and optional theme/preset overrides
- Reads `BIJOU_THEME` env var (or custom `envVar`) to select theme
- Falls back to `CYAN_MAGENTA` for unknown theme names
- `NO_COLOR` env var → `noColor: true` resolved theme
- Output mode detected from `RuntimePort`
- `getDefaultContext()` throws before `setDefaultContext()` is called

**Acceptance criteria:**

```text
createBijou()
  ✓ returns BijouContext with all five fields populated
  ✓ reads BIJOU_THEME from runtime.env and resolves matching preset
  ✓ falls back to CYAN_MAGENTA when BIJOU_THEME is unrecognized
  ✓ uses custom envVar when provided
  ✓ uses custom presets registry when provided
  ✓ noColor: true when NO_COLOR is defined
  ✓ noColor: true when NO_COLOR is empty string
  ✓ detects output mode from runtime (TTY → rich, non-TTY → pipe)

default context
  ✓ getDefaultContext() throws descriptive error before set
  ✓ setDefaultContext() makes context available via get
  ✓ components use default context when ctx omitted
  ✓ _resetDefaultContextForTesting() clears the singleton
```

**Test plan:**
- **Golden path:** create context with mock ports, verify all fields
- **Failure modes:** missing env vars, unknown theme names, get-before-set
- **Fuzz/stress:** N/A (pure wiring)

---

### 3. Test adapter self-tests

**User story:** As a bijou contributor, I want the test adapters themselves tested so I can trust them when testing other modules.

**Requirements:**
- `mockRuntime()` returns correct env vars, TTY states, and dimensions from options
- `mockIO()` queues answers, tracks writes, simulates file ops
- `plainStyle()` returns input text unchanged, no ANSI codes
- `createTestContext()` composes the above into a valid `BijouContext`

**Acceptance criteria:**

```text
mockRuntime()
  ✓ env() returns values from provided env map
  ✓ env() returns undefined for missing keys
  ✓ stdoutIsTTY / stdinIsTTY reflect options
  ✓ columns / rows return provided dimensions or defaults

mockIO()
  ✓ write() captures output to retrievable buffer
  ✓ readLine() returns queued answers in order
  ✓ readLine() returns empty string when queue exhausted
  ✓ readFile() / readDir() use mock filesystem

plainStyle()
  ✓ styled() returns text without ANSI sequences
  ✓ bold() returns text without ANSI sequences
  ✓ rgb() returns text without ANSI sequences

createTestContext()
  ✓ returns BijouContext with specified mode
  ✓ defaults to rich mode when unspecified
  ✓ theme is resolved and functional
```

**Test plan:**
- **Golden path:** construct each adapter, call every method, assert outputs
- **Failure modes:** empty options, exhausted answer queue
- **Fuzz/stress:** N/A

---

### 4. Node.js adapters (bijou-node)

**User story:** As a Node.js developer, I want bijou-node to bridge real process, readline, and chalk APIs to bijou's ports so I can use bijou with one import.

**Requirements:**
- `nodeRuntime()` reads `process.env`, `process.stdout.isTTY`, `process.stdin.isTTY`, `process.stdout.columns`
- `nodeIO()` provides readline line input, stdout write, fs file operations
- `chalkStyle()` applies chalk hex colors and text modifiers; respects `noColor`
- `createNodeContext()` wires all three into a `BijouContext`
- `initDefaultContext()` sets the global default, idempotent

**Acceptance criteria:**

```text
nodeRuntime()
  ✓ env() reads from process.env
  ✓ stdoutIsTTY returns boolean matching process.stdout.isTTY
  ✓ columns returns process.stdout.columns or fallback

nodeIO()
  ✓ write() calls process.stdout.write
  ✓ readLine() resolves with user input from readline
  ✓ readFile() reads real files from disk
  ✓ readDir() lists real directories

chalkStyle()
  ✓ styled() applies hex color via chalk when noColor is false
  ✓ styled() returns plain text when noColor is true
  ✓ bold() wraps text in bold ANSI when noColor is false
  ✓ rgb() applies RGB color via chalk
  ✓ modifiers (dim, strikethrough, inverse) applied correctly

createNodeContext()
  ✓ returns valid BijouContext with all ports wired
  ✓ respects NO_COLOR env var

initDefaultContext()
  ✓ sets global default context on first call
  ✓ idempotent — second call doesn't overwrite
```

**Test plan:**
- **Golden path:** call each adapter, verify output matches Node.js behavior
- **Failure modes:** `NO_COLOR` set, non-TTY stdout, missing env vars
- **Fuzz/stress:** N/A (thin wrappers)

---

### 5. Environment behavior integration tests

**User story:** As a CLI author, I want confidence that bijou behaves correctly across real-world terminal environments: piped output, CI, `NO_COLOR`, screen readers.

**Requirements:**
- End-to-end tests exercising components under different environment configs
- Tests use `createTestContext()`, not real process mutation

**Acceptance criteria:**

```text
NO_COLOR compliance
  ✓ all components render without ANSI escape codes
  ✓ gradientText() returns plain text
  ✓ theme.ink() returns undefined for all tokens
  ✓ box borders render in plain unicode (no color codes)
  ✓ progress bar renders without color

piped / non-interactive output
  ✓ box() returns content only (no border)
  ✓ headerBox() returns label + detail as plain text
  ✓ table() outputs TSV format
  ✓ progressBar() outputs percentage text
  ✓ forms fall back to numbered/line-buffered mode

CI detection
  ✓ CI=true with TTY detects as static mode
  ✓ CI=true without TTY detects as pipe mode

TERM=dumb
  ✓ detected as pipe mode
  ✓ no ANSI codes emitted

accessible mode
  ✓ box() returns content only
  ✓ table() uses row-label format
  ✓ spinnerFrame() returns static text indicator
```

**Test plan:**
- **Golden path:** one test per component per environment config (matrix: component x mode x NO_COLOR)
- **Failure modes:** conflicting env vars (e.g., `NO_COLOR` + TTY), unknown `TERM` values
- **Fuzz/stress:** randomized env var combinations to check for crashes

---

### 6. DTCG theme interop (edge-case hardening)

**User story:** As a design system engineer, I want to import/export bijou themes as DTCG JSON for integration with Style Dictionary, Figma Tokens, etc.

Already has tests — this is about expanding edge-case coverage.

**Acceptance criteria (additions):**

```text
fromDTCG()
  ✓ resolves nested references ({group.token} syntax)
  ✓ throws on circular references
  ✓ throws on unresolvable references
  ✓ handles missing optional fields with sensible defaults

toDTCG()
  ✓ output validates against DTCG schema
  ✓ preserves modifier metadata (bold, dim, etc.)

round-trip
  ✓ every built-in preset survives fromDTCG(toDTCG(preset))
  ✓ custom theme with all token types survives round-trip
```

**Test plan:**
- **Golden path:** convert each preset, validate structure
- **Failure modes:** malformed docs, circular refs, missing required fields
- **Fuzz/stress:** randomly generated DTCG documents with valid structure but edge-case values

---
