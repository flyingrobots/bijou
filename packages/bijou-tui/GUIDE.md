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

## Pure Functions Everywhere

The spring engine, tween engine, timeline, viewport, and scroll state are all pure functions operating on immutable state. This means:

- **Testable**: No timers to mock, no I/O to stub
- **Composable**: Combine them freely in your update function
- **Predictable**: Same input always produces the same output
