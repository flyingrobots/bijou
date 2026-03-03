# bijou Roadmap

> **Tests ARE the Spec.** Every feature is defined by its tests. If it's not tested, it's not guaranteed. Acceptance criteria are written as test descriptions first, implementation second.

Current: **v1.0.0** — Architecture audit remediation

---

## v1.0.0 — Architecture audit remediation

Findings from a full-codebase audit of SOLID, DRY, and test quality. No hexagonal architecture violations were found — the port system is clean. These items address structural debt discovered in component internals and test patterns.

### Phase 1: Port interface cleanup (ISP)

**Problem (initial hypothesis):** `IOPort` is a fat interface — static components only call `write()` but depend on `question()`, `rawInput()`, `readFile()`, `readDir()`, `joinPath()`. `StylePort` was suspected to export unused `rgb()` and `hex()` methods (audit found they are used — see resolution below).

| Task | Package | Notes |
|------|---------|-------|
| ~~**Segregate `IOPort`**~~ | bijou | Done — split into WritePort, QueryPort, InteractivePort, FilePort. IOPort = InteractivePort & FilePort & { onResize }. |
| ~~**Remove dead `StylePort` methods**~~ | bijou | Audited — rgb() is used by gradient.ts and progress.ts, hex() by progress.ts. Confirmed not dead; no removal needed. |
| ~~**Audit `onResize` usage**~~ | bijou | Audited — only called by bijou-tui eventbus.ts. Kept on IOPort (full union) but excluded from core sub-ports (WritePort, QueryPort, InteractivePort). |

### Phase 2: Form abstractions (DRY + SRP)

**Problem:** `select`, `multiselect`, `filter`, and `textarea` duplicate the same interactive/non-interactive branching, render/clearRender/cleanup terminal control, numbered list rendering, title formatting, and validation error display.

| Task | Package | Notes |
|------|---------|-------|
| ~~**Extract `formDispatch()` helper**~~ | bijou | Done — shared mode + TTY routing in `form-utils.ts`. |
| ~~**Extract `terminalRenderer()` utility**~~ | bijou | Done — ANSI cursor helpers (hideCursor, showCursor, moveUp, clearBlock, writeLine). |
| ~~**Extract `renderNumberedOptions()`**~~ | bijou | Done — shared numbered-list renderer for fallback modes. |
| ~~**Extract `formatFormTitle()`**~~ | bijou | Done — styled `? title` formatting with mode/noColor branching. |
| ~~**Extract `writeValidationError()`**~~ | bijou | Done — mode-aware error display for input and textarea. |
| ~~**Standardize on `resolveCtx()`**~~ | bijou | Done — all 6 form files migrated from `getDefaultContext()` to `resolveCtx()`. |

### Phase 3: Background color support (new feature)

**Problem:** Bijou has zero background color support. `StylePort` is foreground-only, `TokenValue` has no `bg` field, and every component pads with plain transparent spaces. The only workaround is the `inverse` modifier (used by `badge()` for pills). To create div-like colored blocks — panel backgrounds, highlighted regions, modal fills — we need background colors as a first-class concept across the token system, style port, adapters, and components.

| Task | Package | Notes |
|------|---------|-------|
| ~~**Add `bg` to `TokenValue`**~~ | bijou | Done — optional `bg?: string` (hex) field on `TokenValue`. Backward-compatible. |
| ~~**Add `bgRgb()` and `bgHex()` to `StylePort`**~~ | bijou | Done — two new methods mirroring `rgb()` / `hex()`. |
| ~~**Update `styled()` to apply `token.bg`**~~ | bijou + bijou-node | Done — `styled()` applies `bgHex(token.bg)` when present. chalk adapter updated. |
| ~~**Update test adapters**~~ | bijou | Done — `plainStyle()` (identity) and `auditStyle()` (recording) implement `bgRgb()` / `bgHex()`. |
| ~~**Add `surface` tokens to theme**~~ | bijou | Done — `surface: { primary, secondary, elevated, overlay, muted }` on all presets. DTCG/extend updated. |
| ~~**Add `bg` / `bgToken` to `box()`**~~ | bijou | Done — `bgToken` fills interior. Pipe/accessible/noColor modes skip bg. |
| ~~**Add `bg` to `flex()` children**~~ | bijou-tui | Done — per-child `bg` and container-level `bg` on `FlexOptions`. Gaps and padding filled. |
| ~~**Add `bg` to overlay primitives**~~ | bijou-tui | Done — `bgToken` on `modal()`, `toast()`, `drawer()` fills interior with background color. |
| ~~**Graceful degradation**~~ | bijou | Done — `noColor`/pipe/accessible modes skip bg. Adapters return text unchanged when noColor. |
| ~~**Tests and examples**~~ | bijou + bijou-tui | Done — unit tests for all bg paths. `examples/background-panels/` demonstrates div-like colored blocks. |

### Phase 4: Large file decomposition (SRP)

**Problem:** Several files exceed 300 lines with multiple distinct responsibilities.

| Task | Package | Notes |
|------|---------|-------|
| **Split `dag.ts` (941 lines)** | bijou | Extract into `dag-layout.ts` (layer assignment, positioning), `dag-edges.ts` (edge routing), `dag-render.ts` (string output + ANSI). Keep `dag.ts` as the public entry that composes them. |
| **Split `markdown.ts` (468 lines)** | bijou | Extract `markdown-parse.ts` (two-pass block/inline parser) and `markdown-render.ts` (mode-specific output). Keep `markdown.ts` as the public entry. |
| **Extract textarea editor** | bijou | Move interactive editor state machine (~200 lines) from `textarea.ts` into `textarea-editor.ts`. |
| **Extract filter interactive UI** | bijou | Move interactive terminal UI (~150 lines) from `filter.ts` into `filter-interactive.ts`. |

### Phase 5: Mode rendering strategy (OCP)

**Problem:** ~22 components repeat `if (mode === 'pipe') ... if (mode === 'accessible') ...` chains. Adding a new output mode requires touching every component.

| Task | Package | Notes |
|------|---------|-------|
| **Design mode renderer pattern** | bijou | Create a `ModeRenderer<Input, Output>` type and `renderByMode()` dispatcher that selects a handler from a mode→renderer map. Components register per-mode renderers instead of using if/else. |
| **Migrate pilot components** | bijou | Convert `alert`, `badge`, `box` as proof-of-concept. Validate the pattern before wider rollout. |
| **Migrate remaining components** | bijou | Convert all ~22 mode-branching components to the registry pattern. |

### Phase 6: Test suite hardening

**Problem:** Some tests are brittle (exact ANSI assertions, whitespace-sensitive `toBe`), and some edge cases are missing.

| Task | Package | Notes |
|------|---------|-------|
| ~~**Replace exact ANSI assertions**~~ | bijou | ✅ Done — 12 raw ANSI assertions replaced with `expectNoAnsi()`, `expectHiddenCursor()`, `expectShownCursor()` semantic helpers. |
| **Relax whitespace-sensitive assertions** | bijou | Audit `toBe` assertions on multi-line component output. Replace with `toContain` / `toMatch` where the test intent is "contains content" not "exact formatting". |
| **Add null/undefined input tests** | bijou | Add defensive tests for all public component APIs: `box(null as any)`, `table({ columns: [], rows: [] })`, etc. |
| **Extract shared test fixtures** | bijou | Create `test/fixtures.ts` with shared option arrays (`COLOR_OPTIONS`, `FRUIT_OPTIONS`) and context builders used across form tests. |
| ~~**Create output assertion helpers**~~ | bijou | ✅ Done — 6 helpers: `expectNoAnsi()`, `expectNoAnsiSgr()`, `expectContainsAnsi()`, `expectHiddenCursor()`, `expectShownCursor()`, `expectWritten()`. Test-only, not in main barrel. |
| ~~**noColor integration test suite**~~ | bijou | ✅ Done — 7 tests covering select, multiselect, filter, textarea, input, confirm with `noColor: true`. Interactive forms use `expectNoAnsiSgr()`, question-based use `expectNoAnsi()`. |

### Phase 7: Theme access pattern (DIP)

**Problem:** Every component hardcodes deep theme paths like `ctx.theme.theme.semantic.primary` and `ctx.theme.theme.border.primary`, coupling them to the exact theme object shape.

| Task | Package | Notes |
|------|---------|-------|
| **Add theme query helpers** | bijou | `ctx.semantic(key)`, `ctx.border(key)` convenience accessors that encapsulate the path traversal. |
| **Migrate components** | bijou | Replace `ctx.theme.theme.semantic.*` with `ctx.semantic()` calls across all components. |

---

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
| **TUI Building Blocks** | ~~`viewport()`~~, ~~`pager()`~~, ~~`interactiveAccordion()`~~, ~~`createPanelGroup()`~~, ~~`navigableTable()`~~, ~~`browsableList()`~~, ~~`filePicker()`~~, ~~`focusArea()`~~, ~~`dagPane()`~~ ✅ |
| **Overlay** | ~~`composite()`~~, ~~`modal()`~~, ~~`toast()`~~, ~~`drawer()`~~ ✅ |
| **Input** | ~~`parseKey()`~~, ~~`createKeyMap()`~~, ~~`createInputStack()`~~, ~~`parseMouse()`~~ ✅ |
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
| ~~**Mouse input**~~ | bijou-tui | ✅ v0.10.0 — Opt-in SGR mouse protocol via `RunOptions.mouse`. `MouseMsg`, `parseMouse()`, `isMouseMsg()`. No port change needed — reuses `rawInput()`. |
| ~~**`DagNode` token expansion**~~ | bijou | ✅ v0.8.0 — `labelToken` and `badgeToken` on `DagNode` for granular per-node styling beyond border color. |
| ~~**`place()`**~~ | bijou-tui | ✅ v0.7.0 — 2D text placement with horizontal + vertical alignment. |
| ~~**`drawer()`**~~ | bijou-tui | ✅ v0.7.0 — Slide-in side panel built on `composite()`. Left/right anchored, configurable width. |
| ~~**CLI/stdin component driver**~~ | bijou-tui | ✅ v0.9.0 — `runScript()` feeds key sequences into TEA apps and captures frames. |
| ~~**`enumeratedList()`**~~ | bijou | ✅ v0.7.0 — Ordered/unordered lists with bullet styles (arabic, alpha, roman, bullet, dash, none). |
| ~~**Terminal hyperlinks**~~ | bijou | ✅ v0.7.0 — Clickable OSC 8 links with graceful fallback. |
| ~~**Adaptive colors**~~ | bijou | ✅ Done — `detectColorScheme(runtime?)` reads `COLORFGBG`, `ResolvedTheme.colorScheme`, `createTestContext({ colorScheme })`. Auto color switching deferred to theme consumer. |
| ~~**Color downsampling**~~ | bijou | ✅ v0.9.0 — `rgbToAnsi256()`, `rgbToAnsi16()`, `nearestAnsi256()`, `ansi256ToAnsi16()` pure conversion functions. |
| ~~**Color manipulation**~~ | bijou | ✅ v0.8.0 — `lighten()`, `darken()`, `mix()`, `complementary()`, `saturate()`, `desaturate()` on theme tokens. |
| ~~**`markdown()`**~~ | bijou | ✅ v0.9.0 — Terminal markdown renderer with headings, inline formatting, lists, code blocks, blockquotes, links, and mode degradation. |
| ~~**`log()`**~~ | bijou | ✅ v0.7.0 — Leveled styled log output (debug/info/warn/error/fatal). |
| ~~**`canvas()` shader primitive**~~ | bijou-tui | ✅ v0.10.0 — `(cols, rows, shader, options?) → string` character-grid renderer. Shader per cell, pipe/accessible → empty. |
| ~~**`box()` width override**~~ | bijou | ✅ v0.10.0 — Optional `width` on `BoxOptions` locks outer width. Content clipped via `clipToWidth()` or right-padded. |

### P2.5 — Code quality & DX

| Feature | Package | Notes |
|---------|---------|-------|
| ~~**Eliminate `as KeyMsg` casts in examples**~~ | examples | ✅ v0.9.0 — Replaced with `isKeyMsg()` / `isResizeMsg()` type guards across all examples, runtime, and tests. |
| ~~**`AuditStylePort` test adapter**~~ | bijou | ✅ v0.9.0 — `auditStyle()` records styled calls for assertion with `wasStyled()` convenience method. |
| ~~**Grapheme cluster support**~~ | bijou + bijou-tui | ✅ v0.9.0 — `segmentGraphemes()`, `graphemeWidth()`, `isWideChar()` using `Intl.Segmenter`. Fixed `visibleLength()`, `clipToWidth()`, `sliceAnsi()`, `truncateLabel()`, and `renderNodeBox()`. |
| ~~**`styledFnGuarded()` helper**~~ | bijou | ✅ Done — `createStyledFn(ctx)` and `createBoldFn(ctx)` in `form-utils.ts`. All 4 interactive form files refactored. |
| ~~**Lint rule for raw ANSI escapes**~~ | bijou | ✅ Done — Vitest-based `ansi-lint.test.ts` scans source for raw `\x1b` escapes. 13 allowed files. |

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
| **Parse F-keys** | bijou-tui | Recognize F1–F12 escape sequences in `parseKey()` and surface as `KeyMsg`. |
| **CodeRabbit review exclusions** | repo config | Add `CLAUDE.md`, `TASKS.md`, `docs/ROADMAP.md` to `.coderabbit.yaml` path filters to reduce false positives on project instructions and planning artifacts. |
| **`detectColorScheme` env accessor** | bijou | Refactor inline `runtime ? runtime.env(key) : process.env[key]` to use shared `env()` closure, matching `detectOutputMode` pattern in the same file (`core/detect/tty.ts`). |

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
| Title screen (animated splash) | `canvas()`, `box({ width })`, `composite()` | ✅ Ready |
