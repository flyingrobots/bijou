# Examples Catalog

> One app per component. Each example gets a `main.ts` + `demo.tape` (VHS) that records a GIF.
>
> Run any example: `npx tsx examples/<name>/main.ts`
> Record any GIF: `vhs examples/<name>/demo.tape`

---

## Static Components

Render output and exit. GIFs are short recordings of the final output.

### [x] `box`

**Component:** `box()`, `headerBox()`
**Demo:** Render a plain box, a headerBox with label+detail, nested boxes, and boxes in each output mode side-by-side.
**GIF:** Single frame showing all box variants stacked vertically. ~2s.

### [x] `table`

**Component:** `table()`
**Demo:** Render a data table with 5-6 columns (mixed alignment), a second table with long content that truncates, and a pipe-mode table (TSV).
**GIF:** Single frame showing both tables. ~2s.

### [x] `tree`

**Component:** `tree()`
**Demo:** Render a filesystem-style tree (src/ with nested dirs and files), and a second tree showing a dependency hierarchy with badges.
**GIF:** Single frame. ~2s.

### [x] `accordion`

**Component:** `accordion()`
**Demo:** Render an accordion with 4 sections, 2 expanded and 2 collapsed. Content includes multi-line text in expanded sections.
**GIF:** Single frame. ~2s.

### [x] `tabs`

**Component:** `tabs()`
**Demo:** Render 3 tab bars: one with the first tab active, one with the middle tab active, one with icons/badges in tab labels.
**GIF:** Single frame showing all 3 tab bars. ~2s.

### [x] `badge`

**Component:** `badge()`
**Demo:** Render all 7 badge variants (success, error, warning, info, accent, primary, muted) in a horizontal row, then a second row showing badges used inline in a sentence.
**GIF:** Single frame. ~2s.

### [x] `alert`

**Component:** `alert()`
**Demo:** Render all 4 alert variants (success, error, warning, info) stacked vertically with realistic messages (deploy succeeded, build failed, deprecation warning, version available).
**GIF:** Single frame. ~2s.

### [x] `separator`

**Component:** `separator()`
**Demo:** Render separators: plain, with a left-aligned label, with a centered label, and between content blocks to show them as dividers.
**GIF:** Single frame. ~2s.

### [x] `skeleton`

**Component:** `skeleton()`
**Demo:** Render a "loading" layout: skeleton lines mimicking a card with a title skeleton, 3 body-text skeletons, and a badge skeleton.
**GIF:** Single frame. ~2s.

### [x] `kbd`

**Component:** `kbd()`
**Demo:** Render a help legend: `kbd('Ctrl') + kbd('C')` to quit, `kbd('↑') kbd('↓')` to navigate, `kbd('Enter')` to select. Show single keys and chord combos.
**GIF:** Single frame. ~2s.

### [x] `breadcrumb`

**Component:** `breadcrumb()`
**Demo:** Render 3 breadcrumb trails: short (Home > Settings), medium (Home > Projects > bijou > src > components), and one with a custom separator.
**GIF:** Single frame. ~2s.

### [x] `stepper`

**Component:** `stepper()`
**Demo:** Render a 4-step stepper (Setup > Configure > Review > Deploy) with step 2 active, steps 1 complete, steps 3-4 pending.
**GIF:** Single frame. ~2s.

### [x] `timeline`

**Component:** `timeline()`
**Demo:** Render a project timeline with 5 events: "Project created", "v0.1.0 released", "Hexagonal refactor", "v0.2.0 released", "Examples added". Mix of completed and upcoming.
**GIF:** Single frame. ~2s.

### [x] `paginator`

**Component:** `paginator()`
**Demo:** Render 3 paginator states: page 1 of 10, page 5 of 10, page 10 of 10. Show both dot-style and number-style if supported.
**GIF:** Single frame. ~2s.

### [x] `gradient-text`

**Component:** `gradientText()`
**Demo:** Render "bijou" in large ASCII art letters with a cyan-to-magenta gradient, then a second line with a different gradient (teal-orange-pink).
**GIF:** Single frame. ~2s.

### [x] `progress-static`

**Component:** `progressBar()`
**Demo:** Render 5 progress bars at 0%, 25%, 50%, 75%, 100% with labels. Show different widths.
**GIF:** Single frame. ~2s.

### [x] `dag`

**Component:** `dag()`
**Demo:** Render a project dependency DAG (7-8 nodes) with badges showing status (DONE, WIP, BLOCKED). Highlight a critical path in a contrasting color.
**GIF:** Single frame showing the full graph. ~2s.

### [x] `dag-fragment`

**Component:** `dagSlice()` + `dag()`
**Demo:** Start with a large DAG (12+ nodes), then render 3 fragments: ancestors of a leaf node, descendants of the root, and a 2-hop neighborhood around a middle node. Show ghost nodes with dashed borders at slice boundaries.
**GIF:** Single frame showing full DAG then the 3 fragments. ~3s.

### [x] `pipe`

**Component:** `detectOutputMode()`, all components
**Demo:** Render the same content (a box with a table inside, a badge, an alert) in all 4 output modes side-by-side: interactive, static, pipe, accessible. Use `createTestContext()` with explicit modes.
**GIF:** Single frame showing the 4-column comparison. ~3s.

### [x] `theme`

**Component:** Theme system, `resolveTheme()`, presets
**Demo:** Render identical components (box, badge, alert, progress bar, separator) in each built-in theme preset (cyan-magenta, teal-orange-pink). Show them side-by-side or stacked with theme name labels.
**GIF:** Single frame. ~3s.

---

## Interactive Forms

Prompt the user, collect input, display result. GIFs show the interaction.

### [x] `input`

**Component:** `input()`
**Demo:** Prompt for a project name with placeholder text, then a second prompt with validation (must be lowercase, no spaces). Show the validation error on bad input, then successful entry.
**GIF:** Type "My Project" → see error → clear → type "my-project" → accept. ~6s.

### [x] `select`

**Component:** `select()`
**Demo:** Present a list of 6 package managers (npm, yarn, pnpm, bun, deno, none). Navigate with arrow keys, select one.
**GIF:** Arrow down 3 times → Enter to select "bun". ~5s.

### [x] `multiselect`

**Component:** `multiselect()`
**Demo:** Present a list of 8 features to enable (TypeScript, ESLint, Prettier, Vitest, etc.) with 2 pre-selected. Toggle a few, confirm.
**GIF:** Space to toggle 2 items, arrow around, Enter to confirm. ~6s.

### [x] `confirm`

**Component:** `confirm()`
**Demo:** Ask "Deploy to production?" with default No. Show pressing Enter (gets default No), then re-prompt and type "y" for Yes.
**GIF:** Enter → No result → second prompt → "y" → Yes result. ~5s.

### [x] `form-group`

**Component:** `group()`
**Demo:** Multi-field form: project name (input), framework (select), features (multiselect), deploy now? (confirm). Show the final collected result object.
**GIF:** Fill out each field in sequence, show final JSON result. ~12s.

---

## TUI Apps

Full-screen interactive apps using the TEA runtime. GIFs show live interaction.

### [x] `counter`

**Component:** TEA runtime (`run()`, `App`, `Cmd`)
**Demo:** Minimal TEA hello-world. A number on screen. Press `+`/`k` to increment, `-`/`j` to decrement, `q` to quit. Show the count updating.
**GIF:** Press + a few times, press - once, press q. ~5s.

### [x] `spinner`

**Component:** `spinnerFrame()` + TEA `tick()`
**Demo:** Show a spinner with "Loading..." status text, then after 3s it changes to "Processing...", then after 2s shows a success checkmark and exits.
**GIF:** Watch the spinner animate through 3 phases. ~6s.

### [x] `progress-animated`

**Component:** `createAnimatedProgressBar()` or TEA + `progressBar()`
**Demo:** A single progress bar that fills from 0-100% with smooth animation over 4 seconds, then shows "Complete!" and exits.
**GIF:** Watch the bar fill up. ~5s.

### [x] `progress-download`

**Component:** `progressBar()` + TEA `tick()`
**Demo:** Simulate downloading 4 packages. Each has its own progress bar. They complete at different rates (staggered). Show package names, speeds, and a total progress bar at the bottom.
**GIF:** Watch 4 bars fill at different rates, total bar tracks overall. ~8s.

### [x] `viewport`

**Component:** `viewport()`, `scrollBy()`, `pageDown()`, etc.
**Demo:** Display a long document (the MIT license or a poem) in a viewport that's ~15 rows tall. Show scrollbar on the right. Scroll with j/k, Page Up/Down.
**GIF:** Scroll down, scroll back up, page down, scroll to bottom. ~8s.

### [x] `flex-layout`

**Component:** `flex()`, `vstack()`, `hstack()`
**Demo:** Build a responsive dashboard: header bar (basis), sidebar (fixed width) + main content (flex: 1). Resize the terminal to show the layout reflowing.
**GIF:** Show the layout, then resize terminal narrower and wider. ~8s.

### [x] `spring`

**Component:** `animate()`, `springStep()`, `SPRING_PRESETS`
**Demo:** Animate a block sliding across the screen using different spring presets. Show 4 springs in parallel (gentle, default, wobbly, stiff) so you can compare the motion character.
**GIF:** Watch 4 blocks spring to position simultaneously. ~5s.

### [x] `timeline-anim`

**Component:** `timeline()`, `animate()`, `sequence()`
**Demo:** Orchestrated animation: a title slides in from left (spring), pauses, then 3 cards fade in sequentially with staggered delays (tween), then a progress bar fills (tween). GSAP-style position syntax.
**GIF:** Watch the choreographed sequence play out. ~6s.

### [x] `modal`

**Component:** `createInputStack()`, `viewport()`
**Demo:** Main screen shows a list. Press `?` to open a help modal overlay (semi-transparent border). Press `Esc` to dismiss. Press `d` to open a confirmation dialog. Show input routing correctly between layers.
**GIF:** Browse list → ? for help → Esc → d for dialog → confirm. ~8s.

### [x] `help`

**Component:** `createKeyMap()`, `helpView()`, `helpShort()`
**Demo:** App with keybindings for navigation, actions, and mode switching. Bottom bar shows `helpShort()`. Press `?` to toggle full `helpView()` overlay showing all bindings grouped by category.
**GIF:** Show short help → press ? → full help → press ? to dismiss. ~6s.

### [x] `print-key`

**Component:** `parseKey()`
**Demo:** Full-screen key event inspector. Press any key and see its parsed `KeyMsg` properties: name, shift, ctrl, alt, meta, raw bytes (hex). Shows a scrolling log of recent keypresses.
**GIF:** Press various keys: Enter, Ctrl+C, arrows, Escape, letters, Shift+Tab. ~8s.

### [x] `fullscreen`

**Component:** `enterScreen()`, `exitScreen()`, alt screen
**Demo:** Start in normal terminal. Press Enter to toggle into alt screen (full-screen mode) showing a centered message. Press Enter again to return to normal terminal with scrollback preserved.
**GIF:** Normal → Enter → alt screen → Enter → back to normal. ~5s.

### [x] `stopwatch`

**Component:** TEA `tick()` + view rendering
**Demo:** A stopwatch display (MM:SS.ms). Press Space to start/stop, `r` to reset, `l` to lap (shows lap times below), `q` to quit.
**GIF:** Start → run 2s → lap → run 1s → lap → stop → reset → quit. ~8s.

### [x] `chat`

**Component:** `viewport()` + `input()` + `vstack()` + `flex()`
**Demo:** Chat UI with a scrollable message history viewport and an input bar at the bottom. Pre-populated with a few messages. Type a message, press Enter, it appears in the viewport which auto-scrolls.
**GIF:** Read messages → type "Hello!" → Enter → see it appear → scroll up → scroll back. ~8s.

### [x] `split-editors`

**Component:** `flex()` + `hstack()` + `createInputStack()`
**Demo:** Two side-by-side panes (50/50 flex). Each is a scrollable viewport. Tab to switch focus (highlighted border on active pane). Each pane scrolls independently.
**GIF:** Scroll left pane → Tab → scroll right pane → Tab → scroll left again. ~8s.

### [x] `composable`

**Component:** Multiple components together
**Demo:** Dashboard combining: header (box with app name + badge), tab bar, main content area (table or tree depending on active tab), status bar with paginator and kbd hints. Show switching tabs to change content.
**GIF:** Browse tabs, see content change, navigate pages. ~10s.

### [x] `package-manager`

**Component:** Real-world showcase
**Demo:** Simulate `npm install`. Show a spinner with "Resolving dependencies...", then switch to a multi-progress view as packages "download", then a tree view of what was installed, then a success alert with stats. Fully automated (no user input).
**GIF:** Watch the full install simulation play out. ~10s.

### [x] `splash`

**Component:** Spring animations + `gradientText()` + `timeline()`
**Demo:** Animated splash screen: logo springs in from above, tagline fades in with a tween, gradient sweeps across, then a "Press any key" prompt pulses. Press a key to exit.
**GIF:** Watch the splash animate in, press a key. ~6s.

---

## Totals

| Category | Count |
|---|---|
| Static components | 20/20 |
| Interactive forms | 5/5 |
| TUI apps | 18/18 |
| **Total** | **43/43** |

> All examples complete.

---

## VHS Tape Template

```tape
# examples/<name>/demo.tape
Output examples/<name>/demo.gif
Set Shell zsh
Set FontFamily "Berkeley Mono"
Set FontSize 14
Set Width 100
Set Height 30
Set Theme "Catppuccin Mocha"
Set Padding 20

Type "npx tsx examples/<name>/main.ts"
Enter
Sleep 2s

# ... interaction-specific commands ...

Sleep 1s
```

## Directory Structure

```
examples/
├── README.md              # Index with GIF thumbnails + descriptions
├── _shared/               # Shared utilities (e.g., init context helper)
│   └── setup.ts           # initDefaultContext() + common imports
├── box/
│   ├── main.ts
│   └── demo.tape
├── table/
│   ├── main.ts
│   └── demo.tape
├── ...
└── package-manager/
    ├── main.ts
    └── demo.tape
```
