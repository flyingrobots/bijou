# @flyingrobots/bijou-tui

TEA runtime for terminal UIs — model/update/view with physics-based animation, flexbox layout, declarative keybindings, and a centralized event bus.

Inspired by [Bubble Tea](https://github.com/charmbracelet/bubbletea) (Go) and [GSAP](https://gsap.com/) animation.

## What's New in 0.6.0?

- **`navigableTable()`** — keyboard-navigable table with focus management, vertical scrolling, and vim-style keybindings
- **`browsableList()`** — navigable list with focus tracking, scroll viewport, descriptions, and convenience keymap
- **`filePicker()`** — directory browser with focus navigation, extension filtering, and `IOPort` integration

See the [CHANGELOG](https://github.com/flyingrobots/bijou/blob/main/docs/CHANGELOG.md) for the full release history.

## Install

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node @flyingrobots/bijou-tui
```

## Quick Start

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run, quit, tick, type App, type KeyMsg } from '@flyingrobots/bijou-tui';

initDefaultContext();

type Model = { count: number };

const app: App<Model> = {
  init: () => [{ count: 0 }, []],

  update: (msg, model) => {
    if (msg.type === 'key') {
      if (msg.key === 'q') return [model, [quit()]];
      if (msg.key === '+') return [{ count: model.count + 1 }, []];
      if (msg.key === '-') return [{ count: model.count - 1 }, []];
    }
    return [model, []];
  },

  view: (model) => `Count: ${model.count}\n\nPress +/- to change, q to quit`,
};

run(app);
```

## Features Breakdown

- **TEA runtime core**: deterministic model/update/view loop with command-driven side effects.
- **Motion system**: spring physics, tweens, and timeline sequencing for orchestrated terminal animation.
- **Layout engine**: flexbox helpers, stacks, split panes, named-area grids, viewport scrolling, and resize-aware rendering.
- **Input architecture**: keymaps, grouped bindings, generated help views, and layered input stack for modal flows.
- **Overlay composition**: modal, toast, drawer, tooltip, and painter-style compositing primitives (including panel-scoped drawers).
- **App shell**: `createFramedApp()` for tabs/help/chrome/pane-focus boilerplate with optional command palette.
- **Stateful building blocks**: navigable table, browsable list, file picker, focus area, and DAG pane with vim-friendly keymaps.

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
import { viewport, createScrollState, scrollBy, pageDown } from '@flyingrobots/bijou-tui';

let scroll = createScrollState(content, viewportHeight);

// Render visible window with scrollbar
const view = viewport({ width: 60, height: 20, content, scrollY: scroll.y });

// Handle scroll keys
scroll = scrollBy(scroll, 1);   // down one line
scroll = pageDown(scroll);       // down one page
```

### Basic Layout

```typescript
import { vstack, hstack } from '@flyingrobots/bijou-tui';

vstack(header, content, footer);       // vertical stack
hstack(2, leftPanel, rightPanel);      // side-by-side with gap
```

### Split Pane

```typescript
import {
  createSplitPaneState, splitPane, splitPaneResizeBy, splitPaneFocusNext,
} from '@flyingrobots/bijou-tui';

let state = createSplitPaneState({ ratio: 0.35 });

// in update:
state = splitPaneResizeBy(state, 2, { total: cols, minA: 16, minB: 16 });
state = splitPaneFocusNext(state);

// in view:
const output = splitPane(state, {
  direction: 'row',
  width: cols,
  height: rows,
  minA: 16,
  minB: 16,
  paneA: (w, h) => renderSidebar(w, h),
  paneB: (w, h) => renderMain(w, h),
});
```

### Grid

```typescript
import { grid } from '@flyingrobots/bijou-tui';

const output = grid({
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
import { helpView, helpShort, helpFor } from '@flyingrobots/bijou-tui';

helpView(kb);           // full grouped multi-line help
helpShort(kb);          // "q Quit • ? Help • Ctrl+c Force quit • j Down • k Up"
helpFor(kb, 'Nav');     // only Navigation group
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
import { composite, modal, toast } from '@flyingrobots/bijou-tui';

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
const output = composite(backgroundView, [dialog, notification], { dim: true });
```

Each overlay is a `{ content, row, col }` object. `composite()` splices them onto the background using painter's algorithm (last overlay wins on overlap). The `dim` option fades the background with ANSI dim.

`drawer()` now supports `left`/`right`/`top`/`bottom` anchors and optional `region` mounting for panel-scoped overlays.

## App Frame

`createFramedApp()` wraps page-level TEA logic in a shared shell:

- tabs + page switching
- pane focus and per-pane scroll isolation
- frame help (`?`) and optional command palette (`ctrl+p` / `:`)
- overlay factory with pane rects for panel-scoped drawers/modals

See `examples/app-frame/main.ts` for a working shell demo.

## Building Blocks

Reusable stateful components that follow the TEA state + pure transformers + sync render + convenience keymap pattern:

### Navigable Table

```typescript
import {
  createNavigableTableState, navigableTable, navTableFocusNext,
  navTableKeyMap, helpShort,
} from '@flyingrobots/bijou-tui';

const state = createNavigableTableState({ columns, rows, height: 10 });
const output = navigableTable(state, { ctx });
const next = navTableFocusNext(state);
```

### Browsable List

```typescript
import {
  createBrowsableListState, browsableList, listFocusNext,
  browsableListKeyMap,
} from '@flyingrobots/bijou-tui';

const state = createBrowsableListState({ items, height: 10 });
const output = browsableList(state);
```

### File Picker

```typescript
import {
  createFilePickerState, filePicker, fpFocusNext, fpEnter, fpBack,
  filePickerKeyMap,
} from '@flyingrobots/bijou-tui';
import { nodeIO } from '@flyingrobots/bijou-node';

const io = nodeIO();
const state = createFilePickerState({ cwd: process.cwd(), io, height: 15 });
const output = filePicker(state);
```

### Focus Area

```typescript
import {
  createFocusAreaState, focusArea, focusAreaScrollBy,
  focusAreaKeyMap,
} from '@flyingrobots/bijou-tui';

const state = createFocusAreaState({ content, width: 60, height: 20, overflowX: 'scroll' });
const output = focusArea(state, { focused: true, ctx });
```

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
