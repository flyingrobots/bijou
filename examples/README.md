# Example Inventory

This is a secondary/internal inventory for maintainers, agents, and
targeted reference use.

If you are trying to learn Bijou, start with
[DOGFOOD](../docs/DOGFOOD.md), not this page.

The example tree still matters for:

- isolated API seam references
- migration and runtime reference cases
- smoke and regression substrate
- implementation sandboxes

It is not the primary public docs surface or learning path anymore.

> Run any example: `npx tsx examples/<name>/main.ts`
> Record release-facing GIFs: `npx tsx scripts/record-gifs.ts`

## Runtime Feature References

These directories keep their historical `v3-*` names, but they are the canonical runtime references for the `4.0.0` line:

| Example | What it proves |
|---------|-----------------|
| [`v3-demo`](./v3-demo/) | Minimal surface-first starter app using the current runtime contract |
| [`v3-css`](./v3-css/) | BCSS type/class/id selectors, token vars, and media-query styling |
| [`v3-motion`](./v3-motion/) | Keyed motion with spring, tween, and initial offsets |
| [`v3-subapp`](./v3-subapp/) | Fractal TEA composition via `initSubApp()`, `updateSubApp()`, and `mount()` |
| [`v3-worker`](./v3-worker/) | Worker runtime plus main-thread/worker data channel |
| [`v3-pipeline`](./v3-pipeline/) | Custom post-process middleware via `configurePipeline()` |

## Showcase

Full-screen interactive component explorer with live previews across all output modes:

```sh
npx tsx examples/showcase/main.ts
```

Browse 45 components across 4 categories (Display, Data, Forms, TUI Blocks). Each component shows rendered output in rich, pipe, and accessible modes side-by-side.

See [showcase](./showcase/) for the structured preview contract and usage notes.

## DOGFOOD

Landing-first story-driven docs slice built with Bijou itself:

```sh
npm run dogfood
```

This example now opens on a hero screen, then drops into a terminal docs
shell with top-level sections for guides, components, packages,
philosophy, and release material. The `Components` section keeps the
three-lane explorer with families on the left, selected-component docs
in the center, and variants on the right.

It proves DOGFOOD as both a docs shell and a living component field
guide:

- `Guides` establishes the reader-first docs path
- `Components` carries the full family/story/variant browser
- `Packages` and `Release` now publish real repo/package/release docs
- `Philosophy` now publishes the doctrine/architecture corpus too

See [docs](./docs/) for the first living-docs preview built from those shared story records.

## Choosing Between Similar Examples

- Use [`note`](./note/) for explanatory, non-urgent support inside a flow.
- Use [`alert`](./alert/) for in-flow status that should remain part of the page.
- Use [`skeleton`](./skeleton/) only for short-lived known-shape loading states; prefer honest partial content once it exists.
- Use [`kbd`](./kbd/) for local inline shortcut cues; use shell help examples when the user needs a broader keybinding reference.
- Use [`toast`](./toast/) for a single low-level transient overlay you are composing directly.
- Use [`notifications`](./notifications/) when the app needs stacking, actions, placement control, routing, or history.
- Use [`progress-static`](./progress-static/) when completion is determinate; use [`spinner`](./spinner/) when activity is real but percent-complete is not.
- Use [`table`](./table/) for passive row/column comparison.
- Use [`navigable-table`](./navigable-table/) when the table itself becomes a keyboard-owned inspection surface.
- Use [`gradient-text`](./gradient-text/) and [`logo`](./logo/) for deliberate expressive moments, not routine application chrome.

## Static Components

| Example | Component | Description |
|---------|-----------|-------------|
| [`box`](./box/) | `box()`, `headerBox()` | Contained sections and titled panels |
| [`table`](./table/) | `table()` | Passive row/column comparison grid |
| [`tree`](./tree/) | `tree()` | Hierarchical tree views |
| [`accordion`](./accordion/) | `accordion()` | Expandable content sections |
| [`tabs`](./tabs/) | `tabs()` | Tab bar navigation with badges |
| [`badge`](./badge/) | `badge()` | Inline status badges in 7 variants |
| [`note`](./note/) | `note()` | Explanatory, non-urgent supporting text for form flows |
| [`alert`](./alert/) | `alert()` | In-flow status block that persists in page content |
| [`separator`](./separator/) | `separator()` | Horizontal dividers with labels |
| [`skeleton`](./skeleton/) | `skeleton()` | Short-lived known-shape loading placeholders |
| [`kbd`](./kbd/) | `kbd()` | Local inline shortcut cues |
| [`breadcrumb`](./breadcrumb/) | `breadcrumb()` | Navigation breadcrumb trails |
| [`stepper`](./stepper/) | `stepper()` | Step progress indicators |
| [`timeline`](./timeline/) | `timeline()` | Event timelines with status |
| [`paginator`](./paginator/) | `paginator()` | Page indicators (dots and text) |
| [`gradient-text`](./gradient-text/) | `gradientText()` | Expressive gradient emphasis for splash and docs |
| [`progress-static`](./progress-static/) | `progressBar()` | Determinate progress bars at fixed states |
| [`dag`](./dag/) | `dag()` | Passive dependency and causal-flow graph |
| [`dag-fragment`](./dag-fragment/) | `dagSlice()` + `dag()` | Focused DAG slices for local dependency review |
| [`dag-stats`](./dag-stats/) | `dagStats()` | Graph health and structural metrics |
| [`enumerated-list`](./enumerated-list/) | `enumeratedList()` | Ordered/unordered lists with 6 bullet styles |
| [`markdown`](./markdown/) | `markdown()` | Bounded structured prose with mode-aware lowering |
| [`logo`](./logo/) | `loadRandomLogo()` | ASCII brand treatment for splash and docs moments |
| [`custom-component`](./custom-component/) | `renderByMode()` | App-authored mode-aware primitive example |
| [`hyperlink`](./hyperlink/) | `hyperlink()` | Trusted terminal links with explicit fallback behavior |
| [`log`](./log/) | `log()` | Leveled styled output (debug through fatal) |
| [`pipe`](./pipe/) | Output modes, all components | Same components in interactive/pipe/accessible mode |
| [`theme`](./theme/) | `createBijou()`, theme presets | Same components in all built-in themes |
| [`background-panels`](./background-panels/) | `box()`, `flex()`, `modal()`, `toast()` | Background token treatment across containment and overlays |

## Interactive Forms

| Example | Component | Description |
|---------|-----------|-------------|
| [`input`](./input/) | `input()` | Text input with validation |
| [`select`](./select/) | `select()` | Single-select menu |
| [`multiselect`](./multiselect/) | `multiselect()` | Checkbox multi-select |
| [`confirm`](./confirm/) | `confirm()` | Yes/no confirmation prompt |
| [`textarea`](./textarea/) | `textarea()` | Multi-line text input with cursor navigation |
| [`filter`](./filter/) | `filter()` | Fuzzy-filter select with real-time search |
| [`form-group`](./form-group/) | `group()` | Multi-field form wizard |
| [`wizard`](./wizard/) | `wizard()` | Multi-step form with conditional skip logic |

## TUI Apps

| Example | Component | Description |
|---------|-----------|-------------|
| [`counter`](./counter/) | `run()`, `App`, `Cmd` | Minimal counter — hello world of TEA |
| [`spinner`](./spinner/) | `spinnerFrame()`, `tick()` | Indeterminate activity with phase transitions |
| [`progress-animated`](./progress-animated/) | `progressBar()`, `tick()` | TEA-driven animated determinate progress |
| [`progress-download`](./progress-download/) | `progressBar()`, `spinnerFrame()`, `tick()` | Mixed determinate and indeterminate download feedback |
| [`viewport`](./viewport/) | `viewportSurface()`, `createScrollStateForContent()`, `scrollBy()`, etc. | Masking viewport for overflow scrolling |
| [`flex-layout`](./flex-layout/) | `flex()`, `vstack()`, `hstack()` | Responsive sidebar + main layout |
| [`spring`](./spring/) | `animate()`, `springStep()`, `SPRING_PRESETS` | Spring physics comparison (4 presets) |
| [`timeline-anim`](./timeline-anim/) | `timeline()`, `animate()`, `sequence()` | Orchestrated GSAP-style animation |
| [`modal`](./modal/) | `modal()`, `compositeSurface()`, `createInputStack()` | Blocking decision overlay with layered input ownership |
| [`toast`](./toast/) | `toast()`, `compositeSurface()` | Low-level transient overlay primitive with explicit anchoring |
| [`notifications`](./notifications/) | `renderNotificationStack()`, `renderNotificationHistory()`, `pushNotification()`, `tickNotifications()` | App-managed notification system with stacking, actions, routing, placement changes, and shell-owned notification review |
| [`help`](./help/) | `createKeyMap()`, `helpViewSurface()`, `helpShortSurface()` | Keybinding manager with surface-native help toggle |
| [`print-key`](./print-key/) | `parseKey()` | Key event inspector with modifier badges |
| [`fullscreen`](./fullscreen/) | `enterScreen()`, `exitScreen()` | Alternate screen with centered content |
| [`stopwatch`](./stopwatch/) | `tick()`, view rendering | Stopwatch with laps, start/stop/reset |
| [`chat`](./chat/) | `viewport()` + `input()` + `vstack()` + `flex()` | Chat UI with message input |
| [`split-editors`](./split-editors/) | `flex()` + `hstack()` + `createInputStack()` | Dual-pane editor with focus switching |
| [`split-pane`](./split-pane/) | `splitPane()`, `splitPaneResizeBy()` | Stateful split layout with focus and divider resizing |
| [`grid-layout`](./grid-layout/) | `grid()`, `gridLayout()` | Named-area grid layout with fixed and fractional tracks |
| [`app-frame`](./app-frame/) | `createFramedApp()` | Tabbed shell with pane focus, help, overlays, and command palette |
| [`transitions`](./transitions/) | `createFramedApp()`, transitions | Dynamic tab transition animations (melt, matrix, scramble, etc.) |
| [`release-workbench`](./release-workbench/) | `createFramedApp()`, `inspectorDrawer()`, command palette | Canonical multi-view control room with pane-scoped inspector drawers and shell-level action discovery |
| [`docs`](./docs/) | `ComponentStory` v0, `createFramedApp()` | First story-driven living-docs slice with profile switching and live demos |
| [`pager`](./pager/) | `pager()`, `pagerKeyMap()` | Scrollable text viewer with status line |
| [`navigable-table`](./navigable-table/) | `navigableTableSurface()`, `navTableKeyMap()` | Keyboard-owned table inspection with row-aware surface scrolling |
| [`browsable-list`](./browsable-list/) | `browsableListSurface()`, `browsableListKeyMap()` | Navigable list with viewport-backed surface masking |
| [`file-picker`](./file-picker/) | `filePickerSurface()`, `filePickerKeyMap()` | Directory browser with fixed header and viewport-backed entry list |
| [`interactive-accordion`](./interactive-accordion/) | `interactiveAccordion()`, `accordionKeyMap()` | Keyboard-navigable accordion with expand/collapse |
| [`composable`](./composable/) | `composable` | Tabbed dashboard combining many components |
| [`package-manager`](./package-manager/) | `package-manager` | Simulated `npm install` (resolve → download → link) |
| [`status-bar`](./status-bar/) | `statusBar()`, `statusBarSurface()` | Segmented header/footer with explicit text and surface paths |
| [`drawer`](./drawer/) | `drawer()`, `compositeSurface()` | Togglable slide-in side panel overlay |
| [`command-palette`](./command-palette/) | `commandPaletteSurface()`, `commandPaletteKeyMap()` | Filterable action list with fixed search row and viewport-backed results |
| [`tooltip`](./tooltip/) | `tooltip()`, `compositeSurface()` | Positioned overlay with directional placement |
| [`canvas`](./canvas/) | `canvas()`, `ShaderFn` | Deliberate shader-driven visual surface |
| [`mouse`](./mouse/) | `parseMouse()`, `MouseMsg` | Mouse event inspector |
| [`focus-area`](./focus-area/) | `focusArea()`, `focusAreaKeyMap()` | Scrollable pane with colored focus gutter |
| [`dag-pane`](./dag-pane/) | `dagPane()`, `dagPaneKeyMap()` | Interactive DAG inspection pane with viewport and focus |
| [`splash`](./splash/) | `splash` | Animated splash screen |
