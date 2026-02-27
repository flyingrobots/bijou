# bijou examples

One app per component. Run any example:

```sh
npx tsx examples/<name>/main.ts
```

Record a GIF with [VHS](https://github.com/charmbracelet/vhs):

```sh
vhs examples/<name>/demo.tape
```

## Static Components

| Example | Component | Description |
|---------|-----------|-------------|
| [box](./box/) | `box()`, `headerBox()` | Bordered containers and header boxes |
| [badge](./badge/) | `badge()` | Inline status badges in 7 variants |
| [alert](./alert/) | `alert()` | Boxed alerts with icons |
| [separator](./separator/) | `separator()` | Horizontal dividers with labels |
| [kbd](./kbd/) | `kbd()` | Keyboard shortcut display |
| [skeleton](./skeleton/) | `skeleton()` | Loading placeholders |
| [table](./table/) | `table()` | Data tables with columns and alignment |
| [tree](./tree/) | `tree()` | Hierarchical tree views |
| [accordion](./accordion/) | `accordion()` | Expandable content sections |
| [timeline](./timeline/) | `timeline()` | Event timelines with status |
| [stepper](./stepper/) | `stepper()` | Step progress indicators |
| [breadcrumb](./breadcrumb/) | `breadcrumb()` | Navigation breadcrumb trails |
| [paginator](./paginator/) | `paginator()` | Page indicators (dots and text) |
| [tabs](./tabs/) | `tabs()` | Tab bar navigation with badges |
| [progress-static](./progress-static/) | `progressBar()` | Static progress bars at various states |
| [gradient-text](./gradient-text/) | `gradientText()` | Gradient-colored text rendering |

## Interactive Forms

| Example | Component | Description |
|---------|-----------|-------------|
| [confirm](./confirm/) | `confirm()` | Yes/no confirmation prompt |
| [input](./input/) | `input()` | Text input with validation |
| [select](./select/) | `select()` | Single-select menu |
| [multiselect](./multiselect/) | `multiselect()` | Checkbox multi-select |
| [form-group](./form-group/) | `group()` | Multi-field form wizard |

## TUI Apps

| Example | Component | Description |
|---------|-----------|-------------|
| [counter](./counter/) | TEA runtime | Minimal counter — hello world of TEA |
| [spinner](./spinner/) | `spinnerFrame()` + `tick()` | Animated spinner with phase transitions |
| [progress-animated](./progress-animated/) | `progressBar()` + `tick()` | Progress bar filling to completion |
| [fullscreen](./fullscreen/) | Alt screen | Alternate screen with centered content |
| [print-key](./print-key/) | `parseKey()` | Key event inspector with modifier badges |
| [stopwatch](./stopwatch/) | `tick()` + state | Stopwatch with laps, start/stop/reset |
| [viewport](./viewport/) | `viewport()` + scroll helpers | Scrollable content pager |
| [help](./help/) | `createKeyMap()` + `helpView()` | Keybinding manager with help toggle |
| [modal](./modal/) | `createInputStack()` | Layered modal input dispatch |
| [progress-download](./progress-download/) | `progressBar()` + `tick()` | Simulated multi-package download |
| [spring](./spring/) | `animate()` + `SPRING_PRESETS` | Spring physics comparison (4 presets) |
| [timeline-anim](./timeline-anim/) | `sequence()` + `animate()` | Orchestrated GSAP-style animation |
| [splash](./splash/) | Spring + tween + `gradientText()` | Animated splash screen |
| [flex-layout](./flex-layout/) | `flex()` | Responsive sidebar + main layout |
| [chat](./chat/) | `viewport()` + `flex()` | Chat UI with message input |
| [split-editors](./split-editors/) | `flex()` + `viewport()` | Dual-pane editor with focus switching |
| [composable](./composable/) | Multiple components | Tabbed dashboard combining many components |
| [package-manager](./package-manager/) | Real-world showcase | Simulated `npm install` (resolve → download → link) |

## Cross-Cutting

| Example | Component | Description |
|---------|-----------|-------------|
| [pipe](./pipe/) | Output modes | Same components in interactive/pipe/accessible mode |
| [theme](./theme/) | Theme presets | Same components in all 4 built-in themes |
