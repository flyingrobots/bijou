# Guide — @flyingrobots/bijou-tui

## Building a TEA App

Every bijou-tui app defines three functions:

```typescript
interface App<Model, M> {
  init(): [Model, Cmd<M>[]];                            // initial state + startup commands
  update(msg: KeyMsg | ResizeMsg | M, model: Model): [Model, Cmd<M>[]];  // state transition
  view(model: Model): string;                            // render to string
}
```

The runtime calls `init()` once, then loops: render → wait for event → `update()` → render.

### Minimal Example

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run, quit, type App, type KeyMsg } from '@flyingrobots/bijou-tui';

initDefaultContext();

type Model = { text: string };
type Msg = never;

const app: App<Model, Msg> = {
  init: () => [{ text: 'Hello!' }, []],
  update: (msg, model) => {
    if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
    return [model, []];
  },
  view: (model) => model.text,
};

run(app);
```

## Handling Resize

The runtime dispatches `ResizeMsg` automatically when the terminal resizes:

```typescript
type Model = { cols: number; rows: number };

update(msg, model) {
  if (msg.type === 'resize') {
    return [{ ...model, cols: msg.columns, rows: msg.rows }, []];
  }
  return [model, []];
}
```

Combine with `flex()` for responsive layouts:

```typescript
view(model) {
  return flex(
    { direction: 'column', width: model.cols, height: model.rows },
    { basis: 1, content: `Terminal: ${model.cols}×${model.rows}` },
    { flex: 1, content: (w, h) => viewport({ width: w, height: h, content: body, scrollY: 0 }) },
    { basis: 1, content: 'Press q to quit' },
  );
}
```

## Flexbox Layout

### Row Direction (side-by-side)

```typescript
flex({ direction: 'row', width: 80, height: 24, gap: 1 },
  { basis: 20, content: sidebar },                        // fixed 20 cols
  { flex: 1, content: (w, h) => mainPanel(w, h) },       // fills remaining
);
```

### Column Direction (stacked)

```typescript
flex({ direction: 'column', width: 80, height: 24 },
  { basis: 1, content: header },        // 1 row
  { flex: 1, content: (w, h) => body }, // fills middle
  { basis: 1, content: footer },        // 1 row
);
```

### Sizing Rules

| Property | Behavior |
|----------|----------|
| `basis` | Fixed size along main axis |
| `flex` | Proportional share of remaining space |
| `minSize` | Floor constraint |
| `maxSize` | Ceiling constraint |
| (none) | Auto-sized from content |

### Render Functions

When a child's `content` is a function, it receives the allocated `(width, height)`. This is how components adapt to available space:

```typescript
{ flex: 1, content: (w, h) => viewport({ width: w, height: h, content, scrollY }) }
```

## Scrollable Viewport

```typescript
import {
  viewport, createScrollState, scrollBy, scrollTo,
  pageDown, pageUp, scrollToTop, scrollToBottom,
} from '@flyingrobots/bijou-tui';

// Initialize scroll state
let scroll = createScrollState(content, viewportHeight);

// In update — handle scroll keys
if (msg.type === 'key') {
  switch (msg.key) {
    case 'down': scroll = scrollBy(scroll, 1); break;
    case 'up':   scroll = scrollBy(scroll, -1); break;
    case 'pagedown': scroll = pageDown(scroll); break;
    case 'pageup':   scroll = pageUp(scroll); break;
    case 'home': scroll = scrollToTop(scroll); break;
    case 'end':  scroll = scrollToBottom(scroll); break;
  }
}

// In view
viewport({ width: 60, height: 20, content, scrollY: scroll.y });
```

The viewport renders a proportional scrollbar in the right gutter. Set `showScrollbar: false` to hide it.

## Animation

### Spring (Physics-Based)

Springs have no fixed duration — they run until the physics settle. This produces natural, responsive motion.

```typescript
import { animate } from '@flyingrobots/bijou-tui';

// In update:
case 'scrollTo':
  return [model, [
    animate({
      from: model.scrollY,
      to: targetY,
      spring: 'wobbly',
      onFrame: (v) => ({ type: 'scrollFrame', y: v }),
    }),
  ]];

case 'scrollFrame':
  return [{ ...model, scrollY: msg.y }, []];
```

### Tween (Duration-Based)

For predictable timing — fades, progress indicators, etc.

```typescript
animate({
  type: 'tween',
  from: 0,
  to: 1,
  duration: 500,
  ease: EASINGS.easeInOutCubic,
  onFrame: (v) => ({ type: 'fadeIn', opacity: v }),
});
```

### Reduced Motion

Pass `immediate: true` to skip animation and jump to the target in one frame:

```typescript
animate({
  from: 0, to: 100,
  immediate: prefersReducedMotion,
  onFrame: (v) => ({ type: 'scroll', y: v }),
});
```

### Chaining

```typescript
import { sequence } from '@flyingrobots/bijou-tui';

// Run one after another
sequence(
  animate({ from: 0, to: 100, onFrame: v => ({ type: 'slideIn', x: v }) }),
  animate({ type: 'tween', from: 0, to: 1, duration: 200, onFrame: v => ({ type: 'fadeIn', opacity: v }) }),
);
```

## Timeline

For complex choreography, use the Timeline — a GSAP-inspired pure state machine.

### Building

```typescript
import { timeline, tick } from '@flyingrobots/bijou-tui';

const tl = timeline()
  .add('slideIn',  { type: 'tween', from: -100, to: 0, duration: 300 })
  .add('fadeIn',   { type: 'tween', from: 0, to: 1, duration: 200 }, '<')   // parallel
  .add('slideOut', { type: 'tween', from: 0, to: 100, duration: 300 }, '+=500') // after 500ms gap
  .label('done')
  .call('onComplete', 'done')
  .build();
```

### Driving from TEA

```typescript
type Model = {
  tl: TimelineState;
  x: number;
  opacity: number;
};

// init
const state = tl.init();
return [{ tl: state, x: 0, opacity: 0 }, [tick(16, { type: 'frame' })]];

// update
case 'frame': {
  const prev = model.tl;
  const next = tl.step(prev, 1/60);
  const vals = tl.values(next);
  const callbacks = tl.firedCallbacks(prev, next);

  const cmds = tl.done(next) ? [] : [tick(16, { type: 'frame' })];

  if (callbacks.includes('onComplete')) {
    // handle completion
  }

  return [{ tl: next, x: vals.slideIn!, opacity: vals.fadeIn! }, cmds];
}
```

### Position Syntax

| Position | Meaning |
|----------|---------|
| (none) | After previous track ends |
| `'<'` | Same start as previous |
| `'<+=200'` | 200ms after previous start |
| `'+=200'` | 200ms after previous end |
| `'-=100'` | Overlap: start 100ms before previous ends |
| `1000` | Absolute time (ms) |
| `'label'` | At the label's position |
| `'label+=200'` | 200ms after label |

## Event Bus

The runtime uses an EventBus internally. For advanced use cases, create your own:

```typescript
import { createEventBus } from '@flyingrobots/bijou-tui';

const bus = createEventBus<MyMsg>();

// Connect I/O (keyboard + resize, parsed automatically)
const handle = bus.connectIO(ctx.io);

// Subscribe to all events
bus.on((msg) => {
  console.log('Event:', msg);
});

// Emit custom events
bus.emit({ type: 'customThing', data: 42 });

// Run a command — result is emitted as a message
bus.runCmd(someCmd);

// Handle quit signals separately
bus.onQuit(() => process.exit(0));

// Clean up
handle.dispose();  // disconnect I/O
bus.dispose();      // disconnect everything
```

### Testing with the Bus

Emit synthetic events directly — no I/O mocking needed:

```typescript
const bus = createEventBus<Msg>();

bus.emit({ type: 'key', key: 'enter', ctrl: false, alt: false, shift: false });
bus.emit({ type: 'resize', columns: 120, rows: 40 });
bus.emit({ type: 'myCustomMsg', value: 42 });
```

## Keybinding Manager

### Declaring Bindings

```typescript
import { createKeyMap } from '@flyingrobots/bijou-tui';

type Msg =
  | { type: 'quit' }
  | { type: 'help' }
  | { type: 'move'; dir: string };

const kb = createKeyMap<Msg>()
  .bind('q', 'Quit', { type: 'quit' })
  .bind('?', 'Toggle help', { type: 'help' })
  .bind('ctrl+c', 'Force quit', { type: 'quit' })
  .group('Navigation', (g) => g
    .bind('j', 'Down', { type: 'move', dir: 'down' })
    .bind('k', 'Up', { type: 'move', dir: 'up' })
    .bind('shift+tab', 'Previous', { type: 'move', dir: 'prev' })
  );
```

Actions are data (messages), not factory functions. This keeps TEA's data-driven model clean.

### Using in TEA Update

```typescript
update(msg, model) {
  if (msg.type === 'key') {
    const action = kb.handle(msg);
    if (action !== undefined) {
      switch (action.type) {
        case 'quit': return [model, [quit()]];
        case 'help': return [{ ...model, showHelp: !model.showHelp }, []];
        case 'move': return [{ ...model, cursor: move(model.cursor, action.dir) }, []];
      }
    }
  }
  return [model, []];
}
```

### Runtime Enable/Disable

```typescript
// Disable by description
kb.disable('Toggle help');

// Disable by predicate
kb.disable((b) => b.group === 'Navigation');

// Disable entire group
kb.disableGroup('Navigation');

// Re-enable
kb.enableGroup('Navigation');
kb.enable('Toggle help');
```

Disabled bindings are skipped during `handle()` and hidden in help output by default.

### Key Descriptors

Supported modifiers: `ctrl`, `alt`, `shift`. Combined with `+`:

```typescript
'q'              // plain key
'ctrl+c'         // modifier + key
'alt+shift+tab'  // multiple modifiers
'enter'          // named keys
'space'          // named keys
'escape'         // named keys
```

Descriptors are case-insensitive — `'Ctrl+C'` and `'ctrl+c'` are equivalent.

## Help Generation

### Full Help View

```typescript
import { helpView } from '@flyingrobots/bijou-tui';

const help = helpView(kb);
// Navigation
//   j           Down
//   k           Up
//   Shift+Tab   Previous
//
// General
//   q       Quit
//   ?       Toggle help
//   Ctrl+c  Force quit
```

### Short Help

```typescript
import { helpShort } from '@flyingrobots/bijou-tui';

helpShort(kb);
// "q Quit • ? Toggle help • Ctrl+c Force quit • j Down • k Up • Shift+Tab Previous"
```

### Filtered Help

```typescript
import { helpFor } from '@flyingrobots/bijou-tui';

helpFor(kb, 'Nav');  // only Navigation group (prefix match, case-insensitive)
```

### Options

```typescript
helpView(kb, {
  enabledOnly: false,    // show disabled bindings too
  separator: ' → ',      // custom key-description separator
  title: 'Keyboard Shortcuts',
});
```

Help functions accept any `BindingSource` — not just `KeyMap`. You can implement custom binding sources for dynamic help content.

## Input Stack

### Why a Stack?

Most TUI apps have layers of input handling: global shortcuts, page-specific keys, modal dialogs. The input stack lets you push and pop handlers as context changes:

```typescript
import { createInputStack, createKeyMap, type KeyMsg } from '@flyingrobots/bijou-tui';

const stack = createInputStack<KeyMsg, Msg>();

// Base layer — global keys, passthrough so unmatched events reach lower layers
const globalKeys = createKeyMap<Msg>()
  .bind('ctrl+c', 'Quit', { type: 'quit' })
  .bind('?', 'Help', { type: 'help' });

stack.push(globalKeys, { passthrough: true });
```

### Modal Pattern

```typescript
// When a modal opens — push opaque layer (blocks everything below)
const modalKeys = createKeyMap<Msg>()
  .bind('enter', 'Confirm', { type: 'confirm' })
  .bind('escape', 'Cancel', { type: 'cancel' });

const modalId = stack.push(modalKeys);  // opaque by default

// In update — dispatch through the stack
const action = stack.dispatch(keyMsg);
// Only 'enter' and 'escape' will match — everything else is swallowed

// When the modal closes — remove the layer
stack.remove(modalId);
// Now global keys work again
```

### Passthrough vs Opaque

- **Opaque** (default): unhandled events stop here — lower layers never see them. Use for modals and dialogs.
- **Passthrough**: unhandled events continue to the next layer. Use for global shortcuts that should always work.

```typescript
// Passthrough — global shortcuts always active
stack.push(globalKeys, { passthrough: true });

// Opaque — page-specific keys, blocks fallthrough
stack.push(pageKeys);

// Result: pageKeys handles its bindings, globalKeys handles the rest,
// anything unmatched by both is swallowed by pageKeys (opaque)
```

### Named Layers

```typescript
stack.push(handler, { name: 'search-modal', passthrough: false });

// Inspect the stack
for (const layer of stack.layers()) {
  console.log(`${layer.name} (${layer.passthrough ? 'passthrough' : 'opaque'})`);
}
```

## Pure Functions Everywhere

The spring engine, tween engine, timeline, viewport, scroll state, keybinding matching, and help generation are all pure functions operating on immutable state. This means:

- **Testable**: No timers to mock, no I/O to stub
- **Composable**: Combine them freely in your update function
- **Predictable**: Same input always produces the same output
