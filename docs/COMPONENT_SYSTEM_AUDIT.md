# Bijou Component System Audit

This document is a Carbon-style audit of the shipped Bijou component surface.

The goal is not just to list APIs. The goal is to answer:

- What is this component for?
- What are its semantic variations?
- Which variants are render-path or interaction-layer variants rather than new components?
- When should it be used?
- When should it not be used?
- Does it belong in core Bijou or in `@flyingrobots/bijou-tui`?
- How does it lower itself across output and interaction layers?
- What is the closest Carbon Design System analogue?

## Design rules

1. A core Bijou component belongs in `@flyingrobots/bijou` when its meaning survives graceful degradation across `rich`, `static`, `pipe`, and `accessible` modes.
2. A TUI component belongs in `@flyingrobots/bijou-tui` when it owns focus, scrolling, keymaps, overlay stacking, animation timing, history, or other lifecycle concerns that do not meaningfully degrade to pipe output.
3. `*Surface` exports are render-path variants, not new design-system components. `boxSurface()` is still `box()`. `tableSurface()` is still `table()`.
4. Interactive wrappers are interaction-layer variants, not new semantics. `interactiveAccordion()` is the TUI-owned interaction layer for `accordion()`. `navigableTable()` is the TUI-owned interaction layer for `table()`.
5. Variants should change tone, density, or behavior within one semantic job. If two exports answer different product questions, they are different components.

## Canonical decision ladders

### Status and feedback

- Use `badge()` for compact inline status attached to nearby content.
- Use `alert()` for in-flow, persistent status that should remain part of the document.
- Use `toast()` for a low-level anchored overlay primitive when the app owns the lifecycle.
- Use the notification system for app-managed transient messaging, stacking, history, action buttons, and routing of warnings/errors.
- Use `log()` for stream output, audit trails, or diagnostic feeds rather than document UI.

### Choice and action discovery

- Use `select()` for short, finite, mutually exclusive choices.
- Use `filter()` for larger option sets that need live narrowing.
- Use `multiselect()` when the user is making a set, not a single choice.
- Use `commandPalette()` for global actions and navigation, not for ordinary field input.

### Content organization

- Use `box()` or `headerBox()` to group related content.
- Use `accordion()` when content is secondary and should be progressively disclosed.
- Use `tabs()` for peer views where only one is active at a time.
- Use `stepper()` for sequential progress, not for free-form navigation.

### Large collections

- Use `table()` for dense comparison across columns.
- Use `navigableTable()` when rows or cells must be actively inspected from the keyboard.
- Use `browsableList()` for one-dimensional items with descriptions.
- Use `tree()` for parent/child hierarchy.
- Use `dag()` when the structure is dependency-oriented instead of strictly hierarchical.

### Overlays

- Use `tooltip()` for lightweight explanation tied to a nearby target.
- Use `drawer()` for supplemental context that should not fully block the workspace.
- Use `modal()` when the user must review, decide, or confirm before continuing.
- Use notifications for interruptive but non-blocking events.

## Family inventory

### Core display and feedback

| Component | Variations | Use when | Avoid when | Layer | Lowering path | Closest Carbon analogue |
| --- | --- | --- | --- | --- | --- | --- |
| `box()` | plain, titled via `headerBox()`, surface path via `boxSurface()` | grouping related content, creating section rhythm, framing dense text or controls | signaling urgency, transient messaging, or deep application layout | core | rich frame -> simpler text frame in static/pipe/accessible | tile / contained section |
| `badge()` | semantic/status variants | short inline state, counts, labels inside other content | multi-line explanation, required action, or standalone messaging | core | colored token -> plain text label | tag |
| `alert()` | semantic alert variants, surface path via `alertSurface()` | persistent in-flow status that should remain visible while the user reads or edits nearby content | transient events, stacked interruptions, or app-level runtime events | core | boxed rich message -> plain emphasized text | inline notification |
| `separator()` | labeled/unlabeled, surface path via `separatorSurface()` | dividing content regions or labeling subsections within a page | primary hierarchy, alerts, or content grouping that needs its own container | core | decorative rule -> simple text divider | divider |
| `skeleton()` | line/block loading placeholders | communicating expected shape during loading | exact progress, actionable status, or long-lived empty state | core | visual placeholder -> plain placeholder text | skeleton text / skeleton placeholder |
| `kbd()` | keycap styling only | showing shortcuts near commands or instructions | representing arbitrary code or primary labels | core | styled keycap -> bracketed text | keyboard interaction hint |
| `spinnerFrame()` / `createSpinner()` | spinner styles and live controller | unknown-duration ongoing work in a narrow space | progress with known completion, historical logs, or large layout regions | core | animated rich frame -> static textual status | inline loading indicator |
| `progressBar()` / live progress controllers | static, live, animated | known-progress work, install flows, downloads, percentages | binary yes/no states or tiny inline labels | core | colored bar -> textual percentage/progress summary | progress bar |
| `timer()` / `createTimer()` / `createStopwatch()` | static timer, live countdown, live stopwatch | elapsed or remaining time is a first-class fact | generic status or event history | core | formatted time -> spoken/plain time | timer / timekeeping pattern |
| `log()` | levels `debug` through `fatal` | audit streams, diagnostics, sequential event feeds | replacing notifications, alerts, or structured page UI | core | styled log line -> plain prefixed log line | inline notification plus activity log pattern |
| `markdown()` | mode-aware markdown rendering | rich prose, docs, release notes, help text | tabular data, strongly interactive content, or guaranteed exact layout | core | rich markdown -> simpler plain text rendering | expressive text / content block |
| `hyperlink()` | OSC 8 link with fallback | clickable links when the terminal supports them | primary navigation inside a TUI shell | core | hyperlink -> printed URL/text fallback | link |
| `note()` | optional title + message | non-interruptive informational aside inside forms and guided flows | alerts, notifications, or content that should compete for attention | core | styled note -> plain explanatory text | helper text / inline help |
| `logo()` | size variants | branding or splash surfaces | essential navigation or state communication | core | ASCII logo -> simpler ASCII logo | brand lockup |

### Core structure, navigation, and data

| Component | Variations | Use when | Avoid when | Layer | Lowering path | Closest Carbon analogue |
| --- | --- | --- | --- | --- | --- | --- |
| `table()` | aligned columns, width-constrained cells, surface path via `tableSurface()` | comparing multiple rows across fixed columns | active row-by-row inspection, hierarchical data, or graph structure | core | rich table -> simplified textual table | data table |
| `tree()` | hierarchical nodes | showing expandable hierarchy or filesystem-like structure in static content | dependency graphs, tabular comparison, or heavily interactive browsing | core | rich tree -> textual tree | tree view |
| `accordion()` | collapsed/expanded sections | progressive disclosure inside one page or form | peer navigation across views, dense row comparison, or app shell navigation | core | rendered expanded/collapsed text -> plain section list | accordion |
| `timeline()` | status/dated events | chronological history, release/event streams, process storytelling | exact comparison tables or dependency graphs | core | rich connected timeline -> ordered event list | structured list / progress narrative |
| `tabs()` | tab items with badges/active state | peer sections where only one pane should be considered active | process progress, deep hierarchy, or command/action lists | core | active-tab rendering -> plain labeled tab row | tabs |
| `breadcrumb()` | path segments | showing location/path hierarchy | step-by-step progress, app-global command navigation, or large menus | core | tokenized path -> plain path text | breadcrumb |
| `paginator()` | dots/text display | communicating page position or finite carousel/page count | workflow steps or arbitrary tabs | core | styled indicator -> plain page summary | pagination |
| `stepper()` | step states | sequential progress through a process | peer page navigation or location hierarchy | core | styled steps -> textual progress sequence | progress indicator |
| `dag()` / `dagSlice()` / `dagStats()` | full graph, fragment, metrics | dependency reasoning, build pipelines, workflow graphs | simple trees, tables, or ordinary lists | core | rich graph -> textual graph/metrics | no exact Carbon equivalent; closest is a specialized data-vis workflow view |
| `enumeratedList()` | ordered/unordered bullet styles | prose-adjacent ordered or unordered lists | row/column comparison, hierarchy, or active selection | core | list styling -> plain list items | ordered / unordered list |

### Core forms and data collection

| Component | Variations | Use when | Avoid when | Layer | Lowering path | Closest Carbon analogue |
| --- | --- | --- | --- | --- | --- | --- |
| `input()` | text input with validation | collecting short free-form text | long-form editing, large option search, or yes/no questions | core | interactive prompt -> line input / accessible text prompt | text input |
| `textarea()` | multi-line text input | collecting notes, paragraphs, or larger structured text | short scalar fields or action search | core | interactive editor -> plain multi-line prompt | text area |
| `confirm()` | yes/no confirmation | single binary confirmation with minimal ambiguity | multiple choices, irreversible review flows needing context, or long forms | core | interactive yes/no -> plain yes/no prompt | modal confirmation pattern |
| `select()` | single-select options | short, finite option sets | long searchable catalogs or global app actions | core | keyboard menu -> numbered list in pipe/accessibility | dropdown |
| `multiselect()` | checkbox set selection | choosing a set of options | single choice or command execution | core | checkbox list -> numbered comma-separated selection | multi-select / checkbox group |
| `filter()` | searchable option list | option sets that are too large for ordinary select | free-form text entry or global command routing | core | interactive filter -> textual filtered selection | combo box |
| `group()` | grouped fields | compact multi-field forms that still fit one mental step | long multi-step workflows or branching flows | core | structured prompt flow -> sequential prompts | form group |
| `wizard()` | multi-step, branching, transformable | staged flows, onboarding, setup, or conditional data collection | short forms that fit comfortably on one screen | core | sequential prompts -> sequential prompts with step text | progress indicator + stepped form |

### TUI interaction-layer components

| Component | Variations | Use when | Avoid when | Layer | Lowering path | Closest Carbon analogue |
| --- | --- | --- | --- | --- | --- | --- |
| `viewport()` | vertical/horizontal scroll state | scrollable content region inside a TUI | static rendering where a plain clipped block is enough | TUI-only | should lower to the underlying rendered content when interaction is absent | scrollable region |
| `pager()` | viewer state + keymap | long-form document/log viewer with explicit paging semantics | arbitrary layout container or editable text | TUI-only | should lower to the content itself or `viewport()` snapshot | document viewer |
| `focusArea()` | focus gutter + scroll region | pane-local focus signaling for keyboard-heavy shells | ordinary static containers or app-global navigation | TUI-only | should lower to styled content without focus affordance | focus treatment pattern |
| `interactiveAccordion()` | keyboard-managed accordion state | accordion content must be navigated and toggled in-place | static documents where `accordion()` is enough | TUI-only | lower to `accordion()` when interactivity is unnecessary | accordion |
| `navigableTable()` | focused row/cell table | keyboard inspection of dense tabular data | plain read-only comparison tables | TUI-only | lower to `table()` in non-interactive contexts | interactive data table |
| `browsableList()` | focused list with descriptions | one-dimensional item exploration with active detail context | tabular data, hierarchy, or global command search | TUI-only | lower to plain list or `enumeratedList()` | selectable list / side-nav list |
| `filePicker()` | directory browser state | filesystem navigation and selection | generic hierarchy unrelated to files | TUI-only | lower to `tree()` or plain path list if needed | file browser pattern |
| `dagPane()` | navigable graph pane | keyboard exploration of a DAG with focus semantics | static graph rendering or ordinary trees | TUI-only | lower to `dag()` snapshot | no exact Carbon equivalent |
| `commandPalette()` | searchable action list | app-global actions, navigation, and commands | field-level selection where the result is stored data rather than an immediate action | TUI-only | lower to documented shortcuts or command list | command palette / searchable action menu |

### TUI overlays and interruption management

| Component | Variations | Use when | Avoid when | Layer | Lowering path | Closest Carbon analogue |
| --- | --- | --- | --- | --- | --- | --- |
| `modal()` | centered blocking overlay | the user must review or decide before continuing | low-severity transient messaging or supplemental context | TUI-only | lower to in-flow page state or confirmation prompt | modal |
| `drawer()` | side overlay, anchored | supplemental context, inspectors, secondary tools | hard-stop confirmation or tiny hint text | TUI-only | lower to alternate pane or section | side panel |
| `tooltip()` | directional hint | brief explanatory text tied to one target | actions, history, or anything that requires scrolling | TUI-only | lower to inline help text | tooltip |
| `toast()` | anchored overlay primitive | simple ephemeral overlay when the app itself owns timing and lifecycle | history, routing, stacking policy, or reusable notification semantics | TUI-only | lower to no-op, log line, or in-flow alert depending on app context | toast notification |
| notification stack/history | variants `TOAST`, `INLINE`, `ACTIONABLE`; tones; placements; history center | app-managed transient communication, reviewable archive, runtime warning/error routing, actionable prompts | primary content, durable document structure, or deep multi-step workflows | TUI-only | lower to logs, alerts, or archived history views; does not belong in core Bijou | toast notification / actionable notification / notification center |

### Shell, layout, and framework primitives

| Component | Variations | Use when | Avoid when | Layer | Lowering path | Closest Carbon analogue |
| --- | --- | --- | --- | --- | --- | --- |
| `createFramedApp()` | tabs, palette, overlays, runtime notifications | multi-view TUI applications that need a real shell | one-off prompts or a single static page | TUI-only | lower to a single-page app or plain `run()` app | UI shell |
| `statusBar()` | segmented header/footer | concise global status, mode, and shortcut context | rich content regions or multi-line explanation | TUI-only | lower to plain status line text | UI shell header/footer |
| `splitPane()` | horizontal/vertical, focusable ratios | resizable two-pane workspaces | simple grouping that does not need user-controlled resizing | TUI-only | lower to stacked content or fixed layout | resizable split layout |
| `grid()` | named areas, fixed/fractional tracks | dashboard-style multi-region layout | simple two-column layouts or strongly sequential content | TUI-only | lower to stacked sections or simplified layout | layout grid |
| `flex()` / `vstack()` / `hstack()` / `place()` | directional/placement layout | compositional layout building blocks | semantic grouping or status signaling by themselves | TUI-only building blocks | lower to simpler text flow or stacked sections | layout primitives |
| `canvas()` | shader-driven effect surface | expressive ambient visuals or demos | core application information architecture | TUI-only | lower to omitted effect or static frame | expressive motion / generative background |

## Components that need stricter semantic positioning

### `alert()` vs `toast()` vs notifications

- `alert()` is static and in-flow. It belongs in core Bijou.
- `toast()` is a low-level overlay primitive. It belongs in `@flyingrobots/bijou-tui`.
- notifications are not just styled toasts. They are a system: lifecycle, stacking, placement, action handling, archive/history, and runtime routing. They belong in `@flyingrobots/bijou-tui`.

### `table()` vs `navigableTable()`

- `table()` answers the question "How should dense data be compared?"
- `navigableTable()` answers the question "How should dense data be inspected and traversed with focus?"
- They are one semantic family with two interaction layers. The docs should present them together.

### `accordion()` vs `interactiveAccordion()`

- `accordion()` is the document-level disclosure component.
- `interactiveAccordion()` is the keyboard-owned TUI interaction layer for that same idea.

### `select()` / `filter()` / `commandPalette()`

- `select()` stores a value.
- `filter()` stores a value from a large option space.
- `commandPalette()` triggers an action or navigates to a place.
- The docs should never present `commandPalette()` as just another select.

### `modal()` / `drawer()` / notifications

- `modal()` blocks.
- `drawer()` supplements.
- notifications interrupt without taking over.
- Those three should be documented as a single escalation ladder.

## Not every public export is a design-system component

These APIs are important, but they should be documented as utilities, render-path variants, or framework seams rather than leaf components:

- `boxSurface()`, `tableSurface()`, `alertSurface()`, `separatorSurface()`, `headerBoxSurface()`
- `dagSlice()`, `dagStats()`
- `constrain()`
- `cursorGuard()` / `withHiddenCursor()`
- `tick()`, `batch()`, `mount()`, `mapCmds()`
- key parsing, input stack, event bus, runtime, and pipeline APIs

## Follow-up recommendations

1. Write one canonical docs page per semantic component family rather than one page per export.
2. Add a standard docs template:
   - What it is
   - Variations
   - When to use
   - When not to use
   - Interaction ownership
   - Graceful degradation path
   - Related components
   - Closest Carbon analogue
3. Reframe showcase/examples around decision points:
   - status and feedback
   - collection browsing
   - form choice patterns
   - overlay escalation
4. Treat surface companions and TUI wrappers as family variants in docs, not as top-level unrelated components.
