# Guide — @flyingrobots/bijou-tui

## Building a TEA App

Every bijou-tui app defines three functions:

```typescript
interface App<Model, M> {
  init(): [Model, Cmd<M>[]];                            // initial state + startup commands
  update(msg: KeyMsg | ResizeMsg | M, model: Model): [Model, Cmd<M>[]];  // state transition
  view(model: Model): Surface | LayoutNode;             // render to structured output
}
```

The runtime calls `init()` once, then loops: render → wait for event → `update()` → render.

### Minimal Example

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { stringToSurface } from '@flyingrobots/bijou';
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
  view: (model) => stringToSurface(model.text, model.text.length, 1),
};

run(app);
```

## Cursor Control

Change cursor shape and blink state via DECSCUSR:

```typescript
import { setCursorStyle, resetCursorStyle, CURSOR_BLOCK } from '@flyingrobots/bijou-tui';

// Set cursor to blinking bar (good for text input)
setCursorStyle(io, 'bar', { blink: true });

// Set cursor to steady block (good for normal mode)
setCursorStyle(io, 'block');

// Reset to terminal default
resetCursorStyle(io);
```

Three shapes: `'block'`, `'underline'`, `'bar'`. Each supports `{ blink: true }`.

Constants `CURSOR_BLOCK`, `CURSOR_UNDERLINE`, `CURSOR_BAR`, and `CURSOR_RESET` are available for direct use with `io.write()`.

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

## Split Pane Layout

Use `splitPane()` for two-pane shells with a stateful ratio and focus.

```typescript
import {
  createSplitPaneState,
  splitPane,
  splitPaneResizeBy,
  splitPaneFocusNext,
} from '@flyingrobots/bijou-tui';

let split = createSplitPaneState({ ratio: 0.4, focused: 'a' });

// In update:
split = splitPaneResizeBy(split, 2, { total: cols, minA: 16, minB: 16 });
split = splitPaneFocusNext(split);

// In view:
const output = splitPane(split, {
  direction: 'row',
  width: cols,
  height: rows,
  minA: 16,
  minB: 16,
  paneA: (w, h) => renderNav(w, h),
  paneB: (w, h) => renderMain(w, h),
});
```

## Grid Layout

Use `grid()` for named-area page composition with fixed and fractional tracks.

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

## Surface-Native Stack and Placement

Use `vstackSurface()` / `hstackSurface()` / `placeSurface()` when the page is already composed from structured `Surface` values and should stay on that path.

```typescript
import {
  hstackSurface,
  placeSurface,
  vstackSurface,
} from '@flyingrobots/bijou-tui';

const body = vstackSurface(headerSurface, contentSurface, footerSurface);
const split = hstackSurface(2, navSurface, mainSurface);
const centered = placeSurface(dialogSurface, {
  width: cols,
  height: rows,
  hAlign: 'center',
  vAlign: 'middle',
});
```

Keep `vstack()` / `hstack()` / `place()` for explicit text composition or deliberate lowering to string-first helpers.

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

## Transition Shaders

Use transition shaders to customize page-to-page movement in `createFramedApp()`.

```typescript
import { createFramedApp, type TransitionShaderFn } from '@flyingrobots/bijou-tui';

const cursorTrail: TransitionShaderFn = ({ progress, x, width, ctx }) => {
  const edge = Math.floor(progress * width);
  if (x < edge) return { showNext: true };
  if (x === edge) {
    return {
      showNext: false,
      overrideChar: '▌',
      overrideCell: {
        char: '▌',
        fg: ctx.status('info').hex,
        bg: ctx.status('info').bg,
        empty: false,
      },
      overrideRole: 'marker',
    };
  }
  return { showNext: false };
};

createFramedApp({
  title: 'Transitions',
  pages,
  transitionOverride: () => cursorTrail,
});
```

Use the shader result fields like this:

| Field | Meaning |
|-------|---------|
| `showNext` | Whether this cell reveals the next page |
| `overrideChar` | Optional single-character override that keeps the chosen base cell styling |
| `overrideCell` | Optional full cell override when the shader needs to control fg/bg/modifiers too |
| `overrideRole` | Semantic hint for combinators; use `'marker'` for positional indicators like cursors and `'decoration'` for ambient noise |

Guidance:
- Prefer `overrideCell` when the shader wants true visual styling, not just a replacement glyph.
- Treat `overrideChar` as a light-weight convenience for inheriting the selected base cell styling.
- Use `'marker'` only for progress-tied indicators that should be dropped by `reverse()` and similar remapping combinators.
- Use `'decoration'` for ambient effects like glitch blocks, static, and scramble noise that can survive progress remapping.

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
'f1'             // function keys (f1–f12)
'shift+f1'       // modified function keys
```

Descriptors are case-insensitive — `'Ctrl+C'` and `'ctrl+c'` are equivalent.

`parseKey()` recognizes F1–F12 via both CSI `~` encoding (e.g. `\x1b[11~`) and SS3 encoding (`\x1bOP`–`\x1bOS`), including Shift/Ctrl/Alt modifier combinations.

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

## Overlay Compositing

### Choosing overlay families

- Use `toast()` when you are composing a single transient overlay directly.
- Use the notification system when the app needs stacking, actions, routing, placement changes, or history.
- Use `drawer()` for supplemental side work that should not fully block the main surface.
- Use `modal()` when the user must stop and decide and background interactions should be blocked.
- Use `tooltip()` only for tiny local explanation. If the content needs commands, scrolling, or recall, pick something else.

Additional guidance:

- If users may need to review prior events, the notification system is the right family, not a pile of ad hoc toasts.
- If the content belongs in the reading flow, move it back into the page as an `alert()` or normal region instead of forcing it into an overlay.
- If interruption is not justified, prefer a drawer over a modal.

### Modals

Create centered dialog overlays for confirm prompts, info boxes, or text input:

```typescript
import { compositeSurface, modal } from '@flyingrobots/bijou-tui';

// In view:
let output = renderMainContent(model);

if (model.showConfirm) {
  const dialog = modal({
    title: 'Delete Item',
    body: `Are you sure you want to delete "${model.selectedName}"?`,
    hint: 'y to confirm, n to cancel',
    screenWidth: model.cols,
    screenHeight: model.rows,
    borderToken: ctx.theme.theme.border.warning,
    ctx,
  });
  output = compositeSurface(output, [dialog], { dim: true });
}

return output;
```

Reach for this low-level `toast()` primitive when explicit anchoring matters, but app-wide notification lifecycle does not. If you need stacking, actionable buttons, archive/history, or framed-app routing, move up to the notification system shown in `examples/notifications`.

The `width` option overrides auto-sizing. Without `ctx`, borders render as plain unicode. `body`, `hint`, `drawer().content`, and `tooltip().content` can all be either plain strings or structured `Surface` values; use structured content when the overlay needs real rows or embedded component surfaces.

### Toasts

Anchored notification overlays for operation feedback:

```typescript
import { compositeSurface, toast } from '@flyingrobots/bijou-tui';

// In view:
let output = renderMainContent(model);

if (model.notification) {
  const t = toast({
    message: model.notification.text,
    variant: model.notification.variant,  // 'success' | 'error' | 'info'
    anchor: 'bottom-right',
    margin: 2,
    screenWidth: model.cols,
    screenHeight: model.rows,
    ctx,
  });
  output = compositeSurface(output, [t]);
}

return output;
```

### Stacking Overlays

Multiple overlays compose with painter's algorithm — later overlays paint over earlier ones:

```typescript
const overlays = [];

if (model.toast) overlays.push(toast({ ...model.toast, screenWidth, screenHeight }));
if (model.modal) overlays.push(modal({ ...model.modal, screenWidth, screenHeight }));

// Modal paints over toast if they overlap
return compositeSurface(background, overlays, { dim: model.modal != null });
```

Every overlay still exposes `content` for explicit lowering paths, but surface-native composition is the preferred default in V4-era TUI apps.

### Drawer Anchors and Panel Scoping

`drawer()` supports `left`/`right`/`top`/`bottom` anchors and optional `region` mounting for panel-scoped overlays.
For dimensions: `left`/`right` require `width`, while `top`/`bottom` require `height`.

```typescript
import { drawer } from '@flyingrobots/bijou-tui';

const inspector = drawer({
  anchor: 'right',
  width: 30,
  region: { row: 3, col: 20, width: 60, height: 18 }, // pane rect
  content: 'Inspector content',
  screenWidth: cols,
  screenHeight: rows,
});
```

## App Frame

`createFramedApp()` wraps page-level TEA logic in a shared shell:

- tab/page switching
- pane focus cycling
- per-page + per-pane scroll isolation
- help toggle (`?`) and optional command palette (`ctrl+p` / `:`)
- `Esc` closes help and dismisses the command palette
- quit behavior is app-defined (examples commonly bind `q` via `globalKeys`)
- overlay hook with pane rect introspection

See `examples/release-workbench/main.ts` for a full canonical shell implementation and `examples/app-frame/main.ts` for a compact focused example.

Shell doctrine:

- tabs are for peer destinations, not command buttons
- status rails are for concise global context, not page prose
- split panes should express comparison, inspection, or supplemental context, not arbitrary screen filling
- if a second region does not materially help the task, keep the app in a simpler single-surface flow

## Pager

Use `pagerSurface()` for long linear text that should stay on the structured `Surface` path while still showing pager status and scroll position.

```typescript
import {
  createPagerStateForSurface,
  pagerSurface,
  pagerScrollBy,
  pagerPageDown,
} from '@flyingrobots/bijou-tui';

const pagerState = createPagerStateForSurface(contentSurface, {
  width: 80,
  height: 24,
});

pagerSurface(contentSurface, pagerState);
pagerScrollBy(pagerState, 1);
pagerPageDown(pagerState);
```

If the content is intentionally text-first, `createPagerState()` + `pager()` remain the explicit lowering path.

## Focus Area

A scrollable pane with a colored left gutter indicating focus state. Wraps `viewport()` with gutter chrome and horizontal overflow support.

```typescript
import {
  createFocusAreaStateForSurface, focusAreaSurface,
  focusAreaScrollBy, focusAreaPageDown, focusAreaScrollByX,
  focusAreaKeyMap,
} from '@flyingrobots/bijou-tui';

// Create state with horizontal scrolling enabled
const fa = createFocusAreaStateForSurface(contentSurface, {
  width: 60,
  height: 20,
  overflowX: 'scroll', // or 'hidden' (default)
});

// In TEA view — gutter is accent-colored when focused, muted when not
focusAreaSurface(contentSurface, fa, { focused: true, ctx });

// In TEA update — scroll transformers
focusAreaScrollBy(fa, 1);      // down one line
focusAreaPageDown(fa);          // one page
focusAreaScrollByX(fa, 5);     // scroll right (only when overflowX='scroll')
```

The gutter character (`▎`) degrades gracefully:
- **Interactive/static mode**: colored or unstyled gutter
- **Pipe/accessible mode**: no gutter (full width to content)

If your pane is still string-composed, `createFocusAreaState()` + `focusArea()` remain available as the explicit text-lowering path.

### Keymap

Arrow keys are intentionally excluded — reserved for content-specific navigation (e.g., DAG node selection). Scroll uses vim keys:

| Key | Action |
|-----|--------|
| `j` / `k` | Scroll down / up |
| `d` / `u` | Page down / up |
| `g` / `G` | Top / bottom |
| `h` / `l` | Scroll left / right |

## DAG Pane

An interactive DAG viewer that wraps `dagLayout()` in a `focusArea()` with arrow-key node navigation, auto-highlight-path, and auto-scroll-to-selection.

```typescript
import type { DagNode } from '@flyingrobots/bijou';
import {
  createDagPaneState, dagPane,
  dagPaneSelectChild, dagPaneSelectParent,
  dagPaneSelectLeft, dagPaneSelectRight,
  dagPaneKeyMap,
} from '@flyingrobots/bijou-tui';

const nodes: DagNode[] = [
  { id: 'A', label: 'Root', edges: ['B', 'C'] },
  { id: 'B', label: 'Left', edges: ['D'] },
  { id: 'C', label: 'Right', edges: ['D'] },
  { id: 'D', label: 'Merge' },
];

// Create state — overflowX defaults to 'scroll' for DAGs
const pane = createDagPaneState({
  source: nodes,
  width: 80,
  height: 24,
  ctx,
});

// In TEA view
dagPane(pane, { focused: true, ctx });

// In TEA update — arrow keys navigate nodes spatially
dagPaneSelectChild(pane, ctx);   // down arrow — picks closest child by column
dagPaneSelectParent(pane, ctx);  // up arrow — picks closest parent by column
dagPaneSelectLeft(pane, ctx);    // left arrow — sibling in same row
dagPaneSelectRight(pane, ctx);   // right arrow — sibling in same row
```

### Navigation Logic

Arrow-key navigation uses the `DagNodePosition` map from `dagLayout()` for spatial selection:

- **Down (child)**: Get children from adjacency map. Pick the child whose column center is closest to the current node's column center.
- **Up (parent)**: Same logic using the parent adjacency map.
- **Left/Right (sibling)**: Find all nodes on the same row. Sort by column. Move to the adjacent node. No wrap-around.
- **No selection + any arrow key**: Auto-select the first root node.

### Auto-Highlight Path

When a node is selected, the pane automatically computes a BFS path from the nearest root to the selected node and passes it as `highlightPath` to `dagLayout()`. This highlights the edges and nodes along the dependency chain.

### Auto-Scroll to Selection

When the selection changes, the viewport automatically scrolls (both vertically and horizontally) to bring the selected node's box into view.

### Keymap

| Key | Action |
|-----|--------|
| Arrow keys | Node selection (parent/child/left/right) |
| `j` / `k` | Scroll down / up |
| `h` / `l` | Scroll left / right |
| `d` / `u` | Page down / up |
| `g` / `G` | Top / bottom |
| `Enter` | Confirm selection |
| `q` / `Ctrl+C` | Quit |

## Pure Functions Everywhere

The spring engine, tween engine, timeline, viewport, scroll state, keybinding matching, and help generation are all pure functions operating on immutable state. This means:

- **Testable**: No timers to mock, no I/O to stub
- **Composable**: Combine them freely in your update function
- **Predictable**: Same input always produces the same output
