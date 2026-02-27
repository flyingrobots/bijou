# @flyingrobots/bijou-tui

TEA runtime for terminal UIs — model/update/view with physics-based animation, flexbox layout, declarative keybindings, and a centralized event bus.

Inspired by [Bubble Tea](https://github.com/charmbracelet/bubbletea) (Go) and [GSAP](https://gsap.com/) animation.

## What's New in 0.4.0?

- **`composite()`** — ANSI-safe overlay compositing with dim background support
- **`modal()`** — centered dialog overlay with title, body, hint, and auto-centering
- **`toast()`** — anchored notification overlay with success/error/info variants
- **`pager()`** — scrollable content viewer with status line and convenience keymap
- **`interactiveAccordion()`** — navigable accordion with focus tracking and expand/collapse
- **`createPanelGroup()`** — multi-pane focus management with hotkey switching

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

## Related Packages

- [`@flyingrobots/bijou`](https://www.npmjs.com/package/@flyingrobots/bijou) — Zero-dependency core with all components and theme engine
- [`@flyingrobots/bijou-node`](https://www.npmjs.com/package/@flyingrobots/bijou-node) — Node.js runtime adapter (chalk, readline, process)

## License

MIT
