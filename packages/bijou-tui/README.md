# `@flyingrobots/bijou-tui`

The high-fidelity TEA runtime for Bijou.

`bijou-tui` provides the application loop, layout primitives, motion, and orchestration needed to build complex interactive terminal apps on top of the Bijou core.

## V3.0.0 Evolution

The TUI package has been completely overhauled in v3.0.0 to operate as a true graphics engine.

### 🌟 What's New
- **Pure view contract:** `App.view` and framed pane renderers now speak `ViewOutput` (`Surface | LayoutNode`).
- **Programmable Rendering Pipeline:** The TEA `view` output is now processed through a 5-stage middleware pipeline (`Layout -> Paint -> PostProcess -> Diff -> Output`). Add custom fragment shaders or logging middleware effortlessly.
- **Fractal TEA (Sub-Apps):** Compose nested apps with `initSubApp()`, `updateSubApp()`, `mount()`, and `mapCmds()` instead of flattening everything into one update loop.
- **Bijou CSS (BCSS):** Style supported V3 surface components and frame shell regions with type/class/id selectors, `var()` token lookups, and terminal-aware media queries (`@media (width < 80)`). This is not yet a global cascade across arbitrary layout nodes.
- **Declarative Motion:** Wrap any component in `motion({ key: 'id' }, ...)` and watch it smoothly interpolate layout changes (move, resize) using physics-based springs.
- **Unified Heartbeat:** All animations and physics calculations are now synchronized to a single `PulseMsg`, eliminating timer jitter and saving CPU.

## Installation

```bash
npm install @flyingrobots/bijou@3.0.0 @flyingrobots/bijou-node@3.0.0 @flyingrobots/bijou-tui@3.0.0
```

If you are upgrading an existing app, see [`../../docs/MIGRATING_TO_V4.md`](../../docs/MIGRATING_TO_V4.md).

## Quick Start (V3 Sub-App Composition)

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run, mount, mapCmds, type App } from '@flyingrobots/bijou-tui';
import { createSurface, type Surface } from '@flyingrobots/bijou';

initDefaultContext();

// Minimal child apps
const childApp: App<{ count: number }, any> = {
  init: () => [{ count: 0 }, []],
  update: (msg, model) => [model, []],
  view: (model) => {
    const s = createSurface(20, 5);
    s.fill({ char: '.' });
    return s;
  }
};

interface Model { 
  left: { count: number }; 
  right: { count: number }; 
}

// Parent App mounting two independent Sub-Apps
const app: App<Model, any> = {
  init: () => [{ left: { count: 0 }, right: { count: 0 } }, []],
  update: (msg, model) => [model, []],
  view: (model) => {
    // Render the children (they return Surfaces!)
    const [leftSurface] = mount(childApp, { model: model.left, onMsg: m => m });
    const [rightSurface] = mount(childApp, { model: model.right, onMsg: m => m });
    
    // Composite them onto the main screen
    const screen = createSurface(80, 24);
    screen.blit(leftSurface, 0, 0);
    screen.blit(rightSurface, 40, 0);
    return screen;
  }
};

run(app);
```

## Quick Start (Basic)

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { stringToSurface } from '@flyingrobots/bijou';
import { run, quit, type App, isKeyMsg } from '@flyingrobots/bijou-tui';

initDefaultContext();

type Model = { count: number };

const app: App<Model> = {
  init: () => [{ count: 0 }, []],

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if (msg.key === 'q') return [model, [quit()]];
      if (msg.key === '+') return [{ count: model.count + 1 }, []];
      if (msg.key === '-') return [{ count: model.count - 1 }, []];
    }
    return [model, []];
  },

  view: (model) => {
    const text = `Count: ${model.count}\n\nPress +/- to change, q to quit`;
    const lines = text.split('\n');
    return stringToSurface(text, Math.max(1, ...lines.map((line) => line.length)), lines.length);
  },
};

run(app);
```

## Runtime Behavior Note

`run()` behaves differently by output mode:

- `interactive`: full TEA loop (event bus, key/resize/mouse handling, command-driven updates).
- `pipe` / `static` / `accessible`: render `view(initModel)` once and return immediately.

In non-interactive modes, there is no normal interactive event loop.

## Features Breakdown

- **TEA runtime core**: deterministic model/update/view loop with command-driven side effects.
- **Motion system**: spring physics, tweens, and timeline sequencing for orchestrated terminal animation.
- **Layout engine**: flexbox helpers, stacks, split panes, named-area grids, viewport scrolling, and resize-aware rendering.
- **Input architecture**: keymaps, grouped bindings, generated help views, and layered input stack for modal flows.
- **Overlay composition**: modal, toast, drawer, tooltip, and painter-style compositing primitives (including panel-scoped drawers).
- **App shell**: `createFramedApp()` for tabs/help/chrome/pane-focus boilerplate with optional command palette.
- **Stateful building blocks**: navigable table, browsable list, file picker, focus area, and DAG pane with vim-friendly keymaps.

## Choosing Component Families

### Overlays and interruption

- Use `toast()` when you are composing a single transient overlay directly.
- Use the notification system when the app needs stacking, placement, actions, routing, or history.
- Use `drawer()` when the user should keep the main surface visible while working in supplemental detail.
- Use `modal()` when background shortcuts and pointer actions should be blocked.
- Use `tooltip()` only for tiny local explanation, not for decisions or scrollable content.

### Collection interaction

- Use core `table()` or `tableSurface()` for passive comparison.
- Use `navigableTable()` when row/cell focus and keyboard traversal are the real job.
- Use `browsableList()` when the content is one-dimensional and description-led rather than grid-oriented.

### Shell and workspace layout

- Use `createFramedApp()` when the app has multiple destinations, overlays, and workspace state that should be standardized.
- Use `splitPane()` when the user benefits from primary-versus-secondary context or side-by-side comparison.
- Use `grid()` when multiple stable regions deserve simultaneous visibility.
- Use `statusBarSurface()` when shell chrome already lives on the structured `Surface` path; keep `statusBar()` for explicit text output.
- Keep status rails concise and global; explanatory text belongs in the page, not in shell chrome.

## Animation

### Spring Physics

```typescript
import { animate, SPRING_PRESETS } from '@flyingrobots/bijou-tui';

// Physics-based (default) — runs until the spring settles
const cmd = animate({
  from: 0,
  to: 100,
  spring: 'wobbly',  // or 'default', 'gentle', 'stiff', 'slow', 'molasses'
  onFrame: (v) => ({ type: 'scroll', y: v }),
});

// Duration-based with easing
const fade = animate({
  type: 'tween',
  from: 0,
  to: 1,
  duration: 300,
  ease: EASINGS.easeOutCubic,
  onFrame: (v) => ({ type: 'fade', opacity: v }),
});

// Skip animation (reduced motion)
const jump = animate({
  from: 0, to: 100,
  immediate: true,
  onFrame: (v) => ({ type: 'scroll', y: v }),
});
```

### Timeline

GSAP-style orchestration — pure state machine, no timers:

```typescript
import { timeline } from '@flyingrobots/bijou-tui';

const tl = timeline()
  .add('slideIn',  { type: 'tween', from: -100, to: 0, duration: 300 })
  .add('fadeIn',   { type: 'tween', from: 0, to: 1, duration: 200 }, '-=100')
  .label('settled')
  .add('bounce',   { from: 0, to: 10, spring: 'wobbly' }, 'settled')
  .call('onReady', 'settled+=50')
  .build();

// Drive from TEA update:
let tlState = tl.init();
// on each frame:
tlState = tl.step(tlState, 1/60);
const { slideIn, fadeIn, bounce } = tl.values(tlState);
const fired = tl.firedCallbacks(prev, tlState); // ['onReady']
```

Position syntax: `'<'` (parallel), `'+=N'` (gap), `'-=N'` (overlap), `'<+=N'` (offset from previous start), absolute ms, `'label'`, `'label+=N'`.

## Transition Shaders

Custom page transitions are surface-native in v4. Shader functions decide whether each cell shows the previous page or next page, and may optionally provide override data for that cell.

```typescript
import { type TransitionShaderFn } from '@flyingrobots/bijou-tui';

const shimmer: TransitionShaderFn = ({ progress, x, width }) => {
  const edge = Math.floor(progress * width);
  if (x < edge) return { showNext: true };
  if (x === edge) return { showNext: false, overrideChar: '░', overrideRole: 'marker' };
  return { showNext: false };
};
```

Use `overrideChar` when the base cell styling should stay intact, `overrideCell` when the shader needs full fg/bg/modifier control, and `overrideRole` to tell combinators whether an override is ambient (`'decoration'`) or positional (`'marker'`).

## Layout

### Flexbox

```typescript
import { flex } from '@flyingrobots/bijou-tui';

// Sidebar + main content, responsive to terminal width
flex({ direction: 'row', width: cols, height: rows, gap: 1 },
  { basis: 20, content: sidebarText },
  { flex: 1, content: (w, h) => renderMain(w, h) },
);

// Header + body + footer
flex({ direction: 'column', width: cols, height: rows },
  { basis: 1, content: headerLine },
  { flex: 1, content: (w, h) => renderBody(w, h) },
  { basis: 1, content: statusLine },
);
```

Children can be **render functions** `(width, height) => string` — they receive their allocated space and reflow automatically when the terminal resizes.

### Viewport

```typescript
import { viewportSurface, createScrollStateForContent, scrollBy, pageDown } from '@flyingrobots/bijou-tui';
import { boxSurface } from '@flyingrobots/bijou';

const content = boxSurface(longText, { width: 72 });
let scroll = createScrollStateForContent(content, viewportHeight);

// Mask the content to a visible window with scrollbar
const view = viewportSurface({ width: 60, height: 20, content, scrollY: scroll.y });

// Handle scroll keys
scroll = scrollBy(scroll, 1);   // down one line
scroll = pageDown(scroll);       // down one page
```

Treat `viewportSurface()` as the canonical scroll mask for rich TUI composition. Keep `viewport()` for explicit text-lowering paths.

### Basic Layout

```typescript
import {
  hstack,
  hstackSurface,
  place,
  placeSurface,
  vstack,
  vstackSurface,
} from '@flyingrobots/bijou-tui';

vstack(header, content, footer);                   // explicit text-lowering path
hstack(2, leftPanel, rightPanel);                  // explicit text-lowering path
place('Title', { width: 20, height: 3 });          // text placement

vstackSurface(headerSurface, bodySurface);         // structured surface stack
hstackSurface(2, navSurface, mainSurface);         // structured horizontal stack
placeSurface(dialogSurface, {                      // structured placement/alignment
  width: cols,
  height: rows,
  hAlign: 'center',
  vAlign: 'middle',
});
```

Prefer `vstackSurface()` / `hstackSurface()` / `placeSurface()` when the view is already composed from `Surface` values. Keep `vstack()` / `hstack()` / `place()` for explicit text composition or lowering paths.

### Split Pane

```typescript
import {
  createSplitPaneState, splitPaneSurface, splitPaneResizeBy, splitPaneFocusNext,
} from '@flyingrobots/bijou-tui';

let state = createSplitPaneState({ ratio: 0.35 });

// in update:
state = splitPaneResizeBy(state, 2, { total: cols, minA: 16, minB: 16 });
state = splitPaneFocusNext(state);

// in view:
const output = splitPaneSurface(state, {
  direction: 'row',
  width: cols,
  height: rows,
  minA: 16,
  minB: 16,
  paneA: (w, h) => renderSidebar(w, h),
  paneB: (w, h) => renderMain(w, h),
});
```

Prefer `splitPaneSurface()` when the panes are already structured `Surface` views. Keep `splitPane()` for explicit text composition or lowering paths.

### Grid

```typescript
import { gridSurface } from '@flyingrobots/bijou-tui';

const output = gridSurface({
  width: cols,
  height: rows,
  columns: [24, '1fr'],
  rows: [3, '1fr', 8],
  areas: [
    'header header',
    'nav main',
    'logs main',
  ],
  gap: 1,
  cells: {
    header: (w, h) => renderHeader(w, h),
    nav: (w, h) => renderNav(w, h),
    logs: (w, h) => renderLogs(w, h),
    main: (w, h) => renderMain(w, h),
  },
});
```

Prefer `gridSurface()` when the regions are already structured `Surface` views. Keep `grid()` for explicit text composition or lowering paths.

## Resize Handling

Terminal resize events are dispatched automatically as `ResizeMsg`:

```typescript
update(msg, model) {
  if (msg.type === 'resize') {
    return [{ ...model, cols: msg.columns, rows: msg.rows }, []];
  }
  // ...
}

view(model) {
  return flex(
    { direction: 'row', width: model.cols, height: model.rows },
    { basis: 20, content: sidebar },
    { flex: 1, content: (w, h) => mainContent(w, h) },
  );
}
```

## Event Bus

The runtime uses an `EventBus` internally. You can also create your own for custom event sources:

```typescript
import { createEventBus } from '@flyingrobots/bijou-tui';

const bus = createEventBus<MyMsg>();
bus.connectIO(ctx.io);           // keyboard + resize
bus.on((msg) => { /* ... */ });  // single subscription
bus.emit(customMsg);             // synthetic events
bus.runCmd(someCommand);         // command results re-emitted
bus.dispose();                   // clean shutdown
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full event flow and [GUIDE.md](./GUIDE.md) for detailed usage patterns.

## Keybinding Manager

Declarative key binding with modifier support, named groups, and runtime enable/disable:

```typescript
import { createKeyMap, type KeyMsg } from '@flyingrobots/bijou-tui';

type Msg = { type: 'quit' } | { type: 'help' } | { type: 'move'; dir: string };

const kb = createKeyMap<Msg>()
  .bind('q', 'Quit', { type: 'quit' })
  .bind('?', 'Help', { type: 'help' })
  .bind('ctrl+c', 'Force quit', { type: 'quit' })
  .group('Navigation', (g) => g
    .bind('j', 'Down', { type: 'move', dir: 'down' })
    .bind('k', 'Up', { type: 'move', dir: 'up' })
  );

// In TEA update:
const action = kb.handle(keyMsg);
if (action !== undefined) return [model, [/* ... */]];

// Runtime enable/disable
kb.disableGroup('Navigation');
kb.enable('Quit');
```

### Help Generation

Auto-generate help text from registered bindings:

```typescript
import {
  helpView,
  helpViewSurface,
  helpShort,
  helpShortSurface,
  helpFor,
  helpForSurface,
} from '@flyingrobots/bijou-tui';

helpView(kb);                       // full grouped multi-line help
helpShort(kb);                      // "q Quit • ? Help • Ctrl+c Force quit • j Down • k Up"
helpFor(kb, 'Nav');                 // only Navigation group
helpShortSurface(kb, { width: 48 }); // shell hint that stays on the Surface path
helpViewSurface(kb, { width: 48 });  // grouped help as a Surface
helpForSurface(kb, 'Nav', { width: 48 });
```

### Input Stack

Layered input dispatch for modal UIs — push/pop handlers with opaque or passthrough behavior:

```typescript
import { createInputStack, type KeyMsg } from '@flyingrobots/bijou-tui';

const stack = createInputStack<KeyMsg, Msg>();

// Base layer — global keys, lets unmatched events fall through
stack.push(appKeys, { passthrough: true });

// Modal opens — captures all input (opaque by default)
const modalId = stack.push(modalKeys);

// Dispatch returns first matched action, top-down
const action = stack.dispatch(keyMsg);

// Modal closes
stack.remove(modalId);
```

`KeyMap` implements `InputHandler`, so it plugs directly into the input stack.

## Overlay Compositing

Paint overlays (modals, toasts) on top of existing content:

```typescript
import { compositeSurface, modal, toast } from '@flyingrobots/bijou-tui';

// Create a centered dialog
const dialog = modal({
  title: 'Confirm',
  body: 'Delete this item?',
  hint: 'y/n',
  screenWidth: 80,
  screenHeight: 24,
});

// Create a toast notification
const notification = toast({
  message: 'Saved successfully',
  variant: 'success',        // 'success' | 'error' | 'info'
  anchor: 'bottom-right',    // 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left'
  screenWidth: 80,
  screenHeight: 24,
});

// Paint overlays onto background content
const output = compositeSurface(backgroundSurface, [dialog, notification], { dim: true });
```

Each overlay now exposes both `surface` and `content` forms. Prefer `compositeSurface()` when your app is already on the surface-native path. Keep the string-oriented `composite()` path for explicit lowering boundaries, not as the default mental model. The `dim` option fades the background with ANSI dim.

`modal().body`, `modal().hint`, `drawer().content`, and `tooltip().content` accept either plain strings or structured `Surface` content. Use surfaces when the overlay needs real rows, embedded component surfaces, or richer composition inside the interrupting layer.

Reach for `toast()` when the app is composing a one-off overlay directly. Reach for the notification system when stacking, actions, routing, or history matter. The notification lab in `examples/notifications` is the canonical higher-level example.

`drawer()` now supports `left`/`right`/`top`/`bottom` anchors and optional `region` mounting for panel-scoped overlays.

## App Frame

`createFramedApp()` wraps page-level TEA logic in a shared shell:

- tabs + page switching
- pane focus and per-pane scroll isolation
- frame help (`?`) and optional command palette (`ctrl+p` / `:`)
- overlay factory with pane rects for panel-scoped drawers/modals

Pane renderers return a `Surface` or a `LayoutNode`. The shell normalizes those outputs into the framed scroll/focus path for you.

See `examples/release-workbench/main.ts` for the canonical shell demo and `examples/app-frame/main.ts` for a compact focused example.

## Building Blocks

Reusable stateful components that follow the TEA state + pure transformers + sync render + convenience keymap pattern:

### Navigable Table

```typescript
import {
  createNavigableTableState, navigableTable, navigableTableSurface, navTableFocusNext,
  navTableKeyMap, helpShort,
} from '@flyingrobots/bijou-tui';

const state = createNavigableTableState({ columns, rows, height: 10 });
const textOutput = navigableTable(state, { ctx });
const surfaceOutput = navigableTableSurface(state, { ctx });
const next = navTableFocusNext(state);
```

Use `navigableTableSurface()` when the user should actively traverse a table inside a rich TUI surface. Keep `navigableTable()` for explicit text lowering. If the job is still passive comparison, prefer core `table()` or `tableSurface()` and keep the interaction layer simpler.

### Browsable List

```typescript
import {
  createBrowsableListState, browsableList, browsableListSurface, listFocusNext,
  browsableListKeyMap,
} from '@flyingrobots/bijou-tui';

const state = createBrowsableListState({ items, height: 10 });
const textOutput = browsableList(state);
const surfaceOutput = browsableListSurface(state, { width: 40 });
```

Use `browsableListSurface()` when the list belongs inside a rich TUI region and should share viewport masking semantics with pagers and focus areas. Keep `browsableList()` for explicit text lowering.

### File Picker

```typescript
import {
  createFilePickerState, filePicker, filePickerSurface, fpFocusNext, fpEnter, fpBack,
  filePickerKeyMap,
} from '@flyingrobots/bijou-tui';
import { nodeIO } from '@flyingrobots/bijou-node';

const io = nodeIO();
const state = createFilePickerState({ cwd: process.cwd(), io, height: 15 });
const textOutput = filePicker(state);
const surfaceOutput = filePickerSurface(state, { width: 60 });
```

Use `filePickerSurface()` when the browser lives inside a rich TUI pane and should inherit shared viewport masking semantics. Keep `filePicker()` for explicit text lowering.

### Command Palette

```typescript
import {
  createCommandPaletteState, commandPalette, commandPaletteSurface,
  cpFilter, commandPaletteKeyMap,
} from '@flyingrobots/bijou-tui';

const state = createCommandPaletteState(items, 8);
const textOutput = commandPalette(state, { width: 60 });
const surfaceOutput = commandPaletteSurface(state, { width: 60, ctx });
```

Use `commandPaletteSurface()` when the palette is part of a structured shell or overlay and should share viewport masking semantics. Keep `commandPalette()` for explicit text lowering.

### Pager

```typescript
import {
  createPagerStateForSurface,
  pagerSurface,
  pagerScrollBy,
} from '@flyingrobots/bijou-tui';

const state = createPagerStateForSurface(contentSurface, { width: 60, height: 20 });
const output = pagerSurface(contentSurface, state);
```

### Focus Area

```typescript
import {
  createFocusAreaStateForSurface, focusAreaScrollBy, focusAreaSurface,
  focusAreaKeyMap,
} from '@flyingrobots/bijou-tui';

const state = createFocusAreaStateForSurface(contentSurface, {
  width: 60,
  height: 20,
  overflowX: 'scroll',
});
const output = focusAreaSurface(contentSurface, state, { focused: true, ctx });
```

If the pane is still intentionally text-composed, `createFocusAreaState()` + `focusArea()` remain the explicit lowering path.

### DAG Pane

```typescript
import {
  createDagPaneState, dagPane, dagPaneSelectChild,
  dagPaneSelectParent, dagPaneKeyMap,
} from '@flyingrobots/bijou-tui';

const state = createDagPaneState({ source: nodes, width: 80, height: 24, ctx });
const output = dagPane(state, { focused: true, ctx });
const next = dagPaneSelectChild(state, ctx); // arrow-key navigation
```

All building blocks include `*KeyMap()` factories for preconfigured vim-style keybindings.

## Related Packages

- [`@flyingrobots/bijou`](https://www.npmjs.com/package/@flyingrobots/bijou) — Zero-dependency core with all components and theme engine
- [`@flyingrobots/bijou-node`](https://www.npmjs.com/package/@flyingrobots/bijou-node) — Node.js runtime adapter (chalk, readline, process)

## License

MIT

---

<p align="center">
Built with 💎 by <a href="https://github.com/flyingrobots">FLYING ROBOTS</a>
</p>

```rust
.-:::::':::   .-:.     ::-.::::::.    :::.  .,-:::::/
;;;'''' ;;;    ';;.   ;;;;';;;`;;;;,  `;;;,;;-'````'
[[[,,== [[[      '[[,[[['  [[[  [[[[[. '[[[[[   [[[[[[/
`$$$"`` $$'        c$$"    $$$  $$$ "Y$c$$"$$c.    "$$
 888   o88oo,.__ ,8P"`     888  888    Y88 `Y8bo,,,o88o
 "MM,  """"YUMMMmM"        MMM  MMM     YM   `'YMUP"YMM
:::::::..       ...     :::::::.      ...   :::::::::::: .::::::.
;;;;``;;;;   .;;;;;;;.   ;;;'';;'  .;;;;;;;.;;;;;;;;'''';;;`    `
 [[[,/[[['  ,[[     \[[, [[[__[[\.,[[     \[[,   [[     '[==/[[[[,
 $$$$$$c    $$$,     $$$ $$""""Y$$$$$,     $$$   $$       '''    $
 888b "88bo,"888,_ _,88P_88o,,od8P"888,_ _,88P   88,     88b    dP
 MMMM   "W"   "YMMMMMP" ""YUMMMP"   "YMMMMMP"    MMM      "YMmMY"
```
