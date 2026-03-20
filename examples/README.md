# Examples

> Run any example: `npx tsx examples/<name>/main.ts`
> Record release-facing GIFs: `npx tsx scripts/record-gifs.ts`

## V3 Features

Start here if you want the canonical V3 story:

| Example | What it proves |
|---------|-----------------|
| [`v3-demo`](./v3-demo/) | Minimal surface-first starter app using the honest V3 runtime contract |
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

## Choosing Between Similar Examples

- Use [`alert`](./alert/) for in-flow status that should remain part of the page.
- Use [`toast`](./toast/) for a single low-level transient overlay you are composing directly.
- Use [`notifications`](./notifications/) when the app needs stacking, actions, placement control, routing, or history.
- Use [`table`](./table/) for passive row/column comparison.
- Use [`navigable-table`](./navigable-table/) when the table itself becomes a keyboard-owned inspection surface.

## Static Components

| Example | Component | Description |
|---------|-----------|-------------|
| [`box`](./box/) | `box()`, `headerBox()` | Bordered containers and header boxes |
| [`table`](./table/) | `table()` | Passive row/column comparison grid |
| [`tree`](./tree/) | `tree()` | Hierarchical tree views |
| [`accordion`](./accordion/) | `accordion()` | Expandable content sections |
| [`tabs`](./tabs/) | `tabs()` | Tab bar navigation with badges |
| [`badge`](./badge/) | `badge()` | Inline status badges in 7 variants |
| [`alert`](./alert/) | `alert()` | In-flow status block that persists in page content |
| [`separator`](./separator/) | `separator()` | Horizontal dividers with labels |
| [`skeleton`](./skeleton/) | `skeleton()` | Loading placeholders |
| [`kbd`](./kbd/) | `kbd()` | Keyboard shortcut display |
| [`breadcrumb`](./breadcrumb/) | `breadcrumb()` | Navigation breadcrumb trails |
| [`stepper`](./stepper/) | `stepper()` | Step progress indicators |
| [`timeline`](./timeline/) | `timeline()` | Event timelines with status |
| [`paginator`](./paginator/) | `paginator()` | Page indicators (dots and text) |
| [`gradient-text`](./gradient-text/) | `gradientText()` | Gradient-colored text rendering |
| [`progress-static`](./progress-static/) | `progressBar()` | Static progress bars at various states |
| [`dag`](./dag/) | `dag()` | Directed acyclic graph with status badges |
| [`dag-fragment`](./dag-fragment/) | `dagSlice()` + `dag()` | DAG slicing with ghost nodes at boundaries |
| [`dag-stats`](./dag-stats/) | `dagStats()` | Graph statistics with cycle and duplicate detection |
| [`enumerated-list`](./enumerated-list/) | `enumeratedList()` | Ordered/unordered lists with 6 bullet styles |
| [`markdown`](./markdown/) | `markdown()` | Terminal markdown with mode degradation |
| [`logo`](./logo/) | `loadRandomLogo()` | Random ASCII brand logos in 3 sizes |
| [`custom-component`](./custom-component/) | `renderByMode()` | Custom mode-aware themed components |
| [`hyperlink`](./hyperlink/) | `hyperlink()` | OSC 8 clickable terminal links with fallback |
| [`log`](./log/) | `log()` | Leveled styled output (debug through fatal) |
| [`pipe`](./pipe/) | Output modes, all components | Same components in interactive/pipe/accessible mode |
| [`theme`](./theme/) | `createBijou()`, theme presets | Same components in all built-in themes |
| [`background-panels`](./background-panels/) | `box()`, `flex()`, `modal()`, `toast()` | Background surface tokens across layout and overlays |

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
| [`spinner`](./spinner/) | `spinnerFrame()`, `tick()` | Animated spinner with phase transitions |
| [`progress-animated`](./progress-animated/) | `createAnimatedProgressBar()`, `progressBar()` | Progress bar filling to completion |
| [`progress-download`](./progress-download/) | `progressBar()`, `tick()` | Simulated multi-package download |
| [`viewport`](./viewport/) | `viewport()`, `scrollBy()`, `pageDown()`, etc. | Scrollable content pager |
| [`flex-layout`](./flex-layout/) | `flex()`, `vstack()`, `hstack()` | Responsive sidebar + main layout |
| [`spring`](./spring/) | `animate()`, `springStep()`, `SPRING_PRESETS` | Spring physics comparison (4 presets) |
| [`timeline-anim`](./timeline-anim/) | `timeline()`, `animate()`, `sequence()` | Orchestrated GSAP-style animation |
| [`modal`](./modal/) | `createInputStack()`, `viewport()` | Layered modal input dispatch |
| [`toast`](./toast/) | `toast()`, `composite()` | Low-level transient overlay primitive with explicit anchoring |
| [`notifications`](./notifications/) | `renderNotificationStack()`, `renderNotificationHistory()`, `pushNotification()`, `tickNotifications()` | App-managed notification system with stacking, actions, routing, placement changes, and history center |
| [`help`](./help/) | `createKeyMap()`, `helpView()`, `helpShort()` | Keybinding manager with help toggle |
| [`print-key`](./print-key/) | `parseKey()` | Key event inspector with modifier badges |
| [`fullscreen`](./fullscreen/) | `enterScreen()`, `exitScreen()` | Alternate screen with centered content |
| [`stopwatch`](./stopwatch/) | `tick()`, view rendering | Stopwatch with laps, start/stop/reset |
| [`chat`](./chat/) | `viewport()` + `input()` + `vstack()` + `flex()` | Chat UI with message input |
| [`split-editors`](./split-editors/) | `flex()` + `hstack()` + `createInputStack()` | Dual-pane editor with focus switching |
| [`split-pane`](./split-pane/) | `splitPane()`, `splitPaneResizeBy()` | Stateful split layout with focus and divider resizing |
| [`grid-layout`](./grid-layout/) | `grid()`, `gridLayout()` | Named-area grid layout with fixed and fractional tracks |
| [`app-frame`](./app-frame/) | `createFramedApp()` | Tabbed shell with pane focus, help, overlays, and command palette |
| [`transitions`](./transitions/) | `createFramedApp()`, transitions | Dynamic tab transition animations (melt, matrix, scramble, etc.) |
| [`release-workbench`](./release-workbench/) | `createFramedApp()`, `grid()`, `splitPane()`, `drawer()` | Canonical multi-view control room with pane-scoped drawers and command palette |
| [`pager`](./pager/) | `pager()`, `pagerKeyMap()` | Scrollable text viewer with status line |
| [`navigable-table`](./navigable-table/) | `navigableTable()`, `navTableKeyMap()` | Keyboard-owned table inspection with focus and scrolling |
| [`browsable-list`](./browsable-list/) | `browsableList()`, `browsableListKeyMap()` | Navigable list with descriptions and scroll viewport |
| [`file-picker`](./file-picker/) | `filePicker()`, `filePickerKeyMap()` | Directory browser with keyboard navigation |
| [`interactive-accordion`](./interactive-accordion/) | `interactiveAccordion()`, `accordionKeyMap()` | Keyboard-navigable accordion with expand/collapse |
| [`composable`](./composable/) | `composable` | Tabbed dashboard combining many components |
| [`package-manager`](./package-manager/) | `package-manager` | Simulated `npm install` (resolve → download → link) |
| [`status-bar`](./status-bar/) | `statusBar()` | Segmented header/footer with fill characters |
| [`drawer`](./drawer/) | `drawer()`, `composite()` | Togglable slide-in side panel overlay |
| [`command-palette`](./command-palette/) | `commandPalette()`, `commandPaletteKeyMap()` | Filterable action list with live search |
| [`tooltip`](./tooltip/) | `tooltip()`, `composite()` | Positioned overlay with directional placement |
| [`canvas`](./canvas/) | `canvas()`, `ShaderFn` | Animated plasma shader effect |
| [`mouse`](./mouse/) | `parseMouse()`, `MouseMsg` | Mouse event inspector |
| [`focus-area`](./focus-area/) | `focusArea()`, `focusAreaKeyMap()` | Scrollable pane with colored focus gutter |
| [`dag-pane`](./dag-pane/) | `dagPane()`, `dagPaneKeyMap()` | Interactive DAG viewer with node navigation |
| [`splash`](./splash/) | `splash` | Animated splash screen |
