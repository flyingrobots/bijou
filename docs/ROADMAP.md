# bijou Roadmap

> **Tests ARE the Spec.** Every feature is defined by its tests. If it's not tested, it's not guaranteed. Acceptance criteria are written as test descriptions first, implementation second.

Current: **v0.8.0** — Command palette, tooltip, color utils, DAG token expansion

---

## Test coverage priorities

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

```
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
  ✓ Ctrl+C throws or returns cancellation sentinel
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

```
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

```
mockRuntime()
  ✓ env() returns values from provided env map
  ✓ env() returns undefined for missing keys
  ✓ stdoutIsTTY / stdinIsTTY reflect options
  ✓ columns / rows return provided dimensions or defaults

mockIO()
  ✓ write() captures output to retrievable buffer
  ✓ readLine() returns queued answers in order
  ✓ readLine() throws when queue exhausted
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

```
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

```
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
  ✓ CI=true with TTY still detects as rich mode
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
- **Golden path:** one test per component per environment config (matrix: component × mode × NO_COLOR)
- **Failure modes:** conflicting env vars (e.g., `NO_COLOR` + TTY), unknown `TERM` values
- **Fuzz/stress:** randomized env var combinations to check for crashes

---

### 6. DTCG theme interop (edge-case hardening)

**User story:** As a design system engineer, I want to import/export bijou themes as DTCG JSON for integration with Style Dictionary, Figma Tokens, etc.

Already has tests — this is about expanding edge-case coverage.

**Acceptance criteria (additions):**

```
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

## Future features

### `appFrame` — TEA app shell (bijou-tui)

Higher-order TEA app that eliminates the boilerplate every TUI app re-implements: tabbed pages, help overlay, scroll, gutters, fullscreen layout.

**Lives in:** `@flyingrobots/bijou-tui` (owns state, not a pure view)

**Core idea:**
- `createFramedApp({ pages, globalKeys })` → `App<FrameModel, FrameMsg>`
- Each page declares its view, per-page help lines, and per-page key bindings
- Frame owns: tab switching, `?` help toggle, scroll state, gutter/chrome rendering
- Delegates content rendering to the active page's `view()`

**Focused scroll:**
- Each page/view has its own independent scroll position (preserved when switching tabs)
- Only the "focused" view scrolls — in a multi-pane layout, focus determines which pane receives scroll input
- Focus can be driven by tab selection or an explicit activation key per pane

**Open questions:**
- Multi-pane layouts (split views) vs. single content area per tab
- How page-level state/update composes with frame-level state (nested TEA? slots?)
- Whether pages can define sub-tabs or if nesting is out of scope

### Component catalog

Growing toward a full terminal component library:

| Category | Components |
|----------|-----------|
| **Element** | ~~`alert()`~~, ~~`badge()`~~, ~~`separator()`~~, ~~`skeleton()`~~, ~~`kbd()`~~ ✅ |
| **Data** | ~~`accordion()`~~, ~~`tree()`~~, ~~`timeline()`~~, ~~`dag()`~~, ~~`dagSlice()`~~, ~~`dagLayout()`~~, ~~`dagStats()`~~ ✅ |
| **Forms** | ~~`input()`~~, ~~`select()`~~, ~~`multiselect()`~~, ~~`confirm()`~~, ~~`group()`~~, ~~`textarea()`~~, ~~`filter()`~~, ~~`wizard()`~~ ✅ |
| **Navigation** | ~~`tabs()`~~, ~~`breadcrumb()`~~, ~~`paginator()`~~, ~~`stepper()`~~, ~~`commandPalette()`~~ ✅ |
| **TUI Building Blocks** | ~~`viewport()`~~, ~~`pager()`~~, ~~`interactiveAccordion()`~~, ~~`createPanelGroup()`~~, ~~`navigableTable()`~~, ~~`browsableList()`~~, ~~`filePicker()`~~ ✅ |
| **Overlay** | ~~`composite()`~~, ~~`modal()`~~, ~~`toast()`~~, ~~`drawer()`~~ ✅ |
| **Input** | ~~`parseKey()`~~, ~~`createKeyMap()`~~, ~~`createInputStack()`~~ ✅, mouse events (`IOPort.onMouse()`) |
| **App** | ~~`statusBar()`~~, ~~`tooltip()`~~ ✅, `splitPane()` |

Each new component should follow this template before implementation:
1. Write user story and requirements
2. Define acceptance criteria as test descriptions
3. Write the tests (they will fail)
4. Implement until tests pass

---

## Backlog

Gaps identified from Charm ecosystem comparison (gum, bubbles, lipgloss, huh). Prioritized by how many other features they unblock.

### ~~P0 — Foundational~~ ✅ Shipped in v0.2.0

| Feature | Package | Status |
|---------|---------|--------|
| ~~**`viewport()`**~~ | bijou-tui | ✅ v0.2.0 |
| ~~**Keybinding manager**~~ | bijou-tui | ✅ v0.2.0 |
| ~~**Help generator**~~ | bijou-tui | ✅ v0.2.0 |

### P1 — Core components

| Feature | Package | Status |
|---------|---------|--------|
| ~~**Interactive `accordion()`**~~ | bijou-tui | ✅ Building block: `interactiveAccordion()`, `accordionKeyMap()`, state transformers |
| ~~**`pager()`**~~ | bijou-tui | ✅ Building block wrapping `viewport()` with status line |
| ~~**`textarea()`**~~ | bijou | ✅ Multi-line text input with cursor nav, line numbers, maxLength |
| ~~**`filter()`**~~ | bijou | ✅ Fuzzy type-to-filter with keyword matching |
| ~~**`browsableList()`**~~ | bijou-tui | ✅ v0.6.0 — Rich list with keyboard nav, scroll viewport, page navigation, descriptions |
| ~~**`filePicker()`**~~ | bijou-tui | ✅ v0.6.0 — Directory browser with extension filtering, IOPort integration |
| ~~**Form wizard**~~ | bijou | ✅ v0.6.0 — `wizard()` multi-step form orchestration with conditional skip logic |
| ~~**`navigableTable()`**~~ | bijou-tui | ✅ v0.6.0 — Keyboard-navigable table with focus, scrolling, vim keybindings |

### ~~P1.5 — Interactive DAG primitives (XYPH-driven)~~ ✅ Shipped

Specs from XYPH for building an interactive roadmap DAG view with 2D panning, node selection, and multi-panel input.

| Feature | Package | Notes | Blocks XYPH? |
|---------|---------|-------|:------------:|
| ~~**Export ANSI utilities**~~ | bijou-tui | ✅ `stripAnsi()`, `visibleLength()`, `clipToWidth()` publicly exported | ✓ |
| ~~**`viewport()` scrollX**~~ | bijou-tui | ✅ `scrollX` option, `sliceAnsi()`, `scrollByX()`/`scrollToX()`, `maxX` in `ScrollState` | ✓ |
| ~~**`dag()` `selectedId`**~~ | bijou | ✅ `selectedId`/`selectedToken` with highest priority over highlight path | ✓ |
| ~~**`dagLayout()`**~~ | bijou | ✅ Returns rendered string + `Map<string, DagNodePosition>` with grid coordinates | |
| ~~**`createPanelGroup()`**~~ | bijou-tui | ✅ Multi-panel focus with InputStack integration, hotkey switching, `formatLabel()` | |

### ~~P1.75 — XYPH Dashboard blockers~~ ✅ Shipped (overlay primitives)

| Feature | Package | Notes | Blocks XYPH? |
|---------|---------|-------|:------------:|
| ~~**`composite()` overlay**~~ | bijou-tui | ✅ Painter's algorithm compositing with ANSI-safe splicing, dim background support | ✓ |
| ~~**`modal()`**~~ | bijou-tui | ✅ Centered dialog overlay with title, body, hint, auto-centering, themed borders | ✓ |
| ~~**`toast()`**~~ | bijou-tui | ✅ Anchored notification overlay with success/error/info variants, 4-corner anchoring | ✓ |

~~Remaining from P1.75 (deferred — not an overlay primitive):~~ ✅ Shipped in v0.6.0

| Feature | Package | Notes | Blocks XYPH? |
|---------|---------|-------|:------------:|
| ~~**`dagStats()`**~~ | bijou | ✅ v0.6.0 — Pure graph statistics with cycle detection, ghost-node filtering, `SlicedDagSource` support | |

### P2 — Layout, input & styling primitives

| Feature | Package | Notes |
|---------|---------|-------|
| **Mouse input** | bijou + bijou-node + bijou-tui | `IOPort.onMouse()` with SGR mouse parsing, `MouseMsg` in TEA runtime. Breaking change (new port method). |
| ~~**`DagNode` token expansion**~~ | bijou | ✅ v0.8.0 — `labelToken` and `badgeToken` on `DagNode` for granular per-node styling beyond border color. |
| ~~**`place()`**~~ | bijou-tui | ✅ v0.7.0 — 2D text placement with horizontal + vertical alignment. |
| ~~**`drawer()`**~~ | bijou-tui | ✅ v0.7.0 — Slide-in side panel built on `composite()`. Left/right anchored, configurable width. |
| **CLI/stdin component driver** | bijou-tui | Drive component state via CLI flags or streaming stdin commands. Enables scripted demos, testing, and external control. |
| ~~**`enumeratedList()`**~~ | bijou | ✅ v0.7.0 — Ordered/unordered lists with bullet styles (arabic, alpha, roman, bullet, dash, none). |
| ~~**Terminal hyperlinks**~~ | bijou | ✅ v0.7.0 — Clickable OSC 8 links with graceful fallback. |
| **Adaptive colors** | bijou | Runtime light/dark background detection, auto color switching. |
| **Color downsampling** | bijou | Truecolor → ANSI256 → ANSI graceful fallback chain. |
| ~~**Color manipulation**~~ | bijou | ✅ v0.8.0 — `lighten()`, `darken()`, `mix()`, `complementary()`, `saturate()`, `desaturate()` on theme tokens. |
| **`markdown()`** | bijou | Render markdown with syntax highlighting. |
| ~~**`log()`**~~ | bijou | ✅ v0.7.0 — Leveled styled log output (debug/info/warn/error/fatal). |

### P2.5 — Code quality & DX

| Feature | Package | Notes |
|---------|---------|-------|
| **Eliminate `as KeyMsg` casts in examples** | examples | All 20+ examples use `'type' in msg && msg.type === 'key'` with an unsafe `as KeyMsg` cast. Refactor Msg unions to include `KeyMsg` for proper type narrowing. |
| **`StyleAuditPort` test adapter** | bijou | Current `plainStyle()` is a no-op — can't verify token application in tests. Add an adapter that records styled calls for assertion. |
| **Grapheme cluster support** | bijou-tui | `[...str]` splits by code points, not grapheme clusters. Multi-codepoint emoji (flags, skin tones) misalign charType mapping in dag renderer and width calculations in viewport/layout. Consider `Intl.Segmenter`. |

### P3 — Nice to have

| Feature | Package | Notes |
|---------|---------|-------|
| **Timer / Stopwatch** | bijou | Countdown and elapsed-time display components. |
| **Cursor manager** | bijou-tui | Cursor style/blink management. |
| **Underline variants** | bijou | Curly, dotted, dashed underlines. |
| **MaxWidth / MaxHeight** | bijou | Truncation constraints on styled blocks. |
| **Dynamic forms** | bijou | Fields that change based on previous input values. |
| **Custom fill chars** | bijou | Custom characters for padding/margin areas. |
| **Note field** | bijou | Display-only text within a form flow. |
| **Scrollable select** | bijou | Fixed-height select with overflow scrolling. |

---

### Xyph migration

Once published:
1. `npm install @flyingrobots/bijou @flyingrobots/bijou-node`
2. Create xyph-specific theme preset with custom status keys
3. Replace inline rendering with bijou components
4. Domain-specific views stay in xyph

**XYPH TUI Dashboard dependency map:**

| XYPH Phase | Bijou dependency | Status |
|------------|-----------------|--------|
| Phase 1 (views, selection, writes) | `selectedId`, ANSI utils, `InputStack` | ✅ Ready |
| Phase 1h (confirm/input overlays) | `composite()`, `modal()` | ✅ Ready |
| Phase 2 (review actions, detail panel) | `selectedId`, ANSI utils | ✅ Ready |
| Phase 3 (full DAG interactivity) | `scrollX`, `dagLayout()`, `createPanelGroup()` | ✅ Ready |
