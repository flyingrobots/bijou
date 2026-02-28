# Examples

> 57 examples · Run any: `npx tsx examples/<name>/main.ts`
> Record all GIFs: `../scripts/record-gifs.sh`

## Static Components

| Example | Component | Description |
|---------|-----------|-------------|
| [`box`](./box/) | `box()`, `headerBox()` | Bordered containers and header boxes |
| [`table`](./table/) | `table()` | Data tables with columns and alignment |
| [`tree`](./tree/) | `tree()` | Hierarchical tree views |
| [`accordion`](./accordion/) | `accordion()` | Expandable content sections |
| [`tabs`](./tabs/) | `tabs()` | Tab bar navigation with badges |
| [`badge`](./badge/) | `badge()` | Inline status badges in 7 variants |
| [`alert`](./alert/) | `alert()` | Boxed alerts with icons |
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
| [`hyperlink`](./hyperlink/) | `hyperlink()` | OSC 8 clickable terminal links with fallback |
| [`log`](./log/) | `log()` | Leveled styled output (debug through fatal) |
| [`pipe`](./pipe/) | `detectOutputMode()`, all components | Same components in interactive/pipe/accessible mode |
| [`theme`](./theme/) | `resolveTheme()`, theme presets | Same components in all built-in themes |

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
| [`help`](./help/) | `createKeyMap()`, `helpView()`, `helpShort()` | Keybinding manager with help toggle |
| [`print-key`](./print-key/) | `parseKey()` | Key event inspector with modifier badges |
| [`fullscreen`](./fullscreen/) | `enterScreen()`, `exitScreen()` | Alternate screen with centered content |
| [`stopwatch`](./stopwatch/) | `tick()`, view rendering | Stopwatch with laps, start/stop/reset |
| [`chat`](./chat/) | `viewport()` + `input()` + `vstack()` + `flex()` | Chat UI with message input |
| [`split-editors`](./split-editors/) | `flex()` + `hstack()` + `createInputStack()` | Dual-pane editor with focus switching |
| [`pager`](./pager/) | `pager()`, `pagerKeyMap()` | Scrollable text viewer with status line |
| [`navigable-table`](./navigable-table/) | `navigableTable()`, `navTableKeyMap()` | Keyboard-navigable data table with scrolling |
| [`browsable-list`](./browsable-list/) | `browsableList()`, `browsableListKeyMap()` | Navigable list with descriptions and scroll viewport |
| [`file-picker`](./file-picker/) | `filePicker()`, `filePickerKeyMap()` | Directory browser with keyboard navigation |
| [`interactive-accordion`](./interactive-accordion/) | `interactiveAccordion()`, `accordionKeyMap()` | Keyboard-navigable accordion with expand/collapse |
| [`composable`](./composable/) | `composable` | Tabbed dashboard combining many components |
| [`package-manager`](./package-manager/) | `package-manager` | Simulated `npm install` (resolve → download → link) |
| [`status-bar`](./status-bar/) | `statusBar()` | Segmented header/footer with fill characters |
| [`drawer`](./drawer/) | `drawer()`, `composite()` | Togglable slide-in side panel overlay |
| [`splash`](./splash/) | `splash` | Animated splash screen |
