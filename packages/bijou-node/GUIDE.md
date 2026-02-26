# Guide — @flyingrobots/bijou-node

## Basic Setup

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';

// One line — auto-detects everything
initDefaultContext();
```

This detects:
- **TTY** → interactive mode (full colors, unicode)
- **`CI=true`** → static mode (single-frame, no animations)
- **Piped stdout / `TERM=dumb`** → pipe mode (plain text)
- **`NO_COLOR`** → disables all color output
- **`BIJOU_ACCESSIBLE=1`** → accessible mode (screen-reader friendly)

## Custom Context

If you need more control, create the context without setting the global default:

```typescript
import { createNodeContext } from '@flyingrobots/bijou-node';
import { box } from '@flyingrobots/bijou';

const ctx = createNodeContext();

// Pass explicitly to components
console.log(box('hello', { ctx }));
```

## Individual Adapters

For advanced use cases, construct adapters individually:

```typescript
import { nodeRuntime, nodeIO, chalkStyle } from '@flyingrobots/bijou-node';

const runtime = nodeRuntime();
const io = nodeIO();
const style = chalkStyle({ noColor: false });

// Use runtime for environment checks
if (runtime.stdoutIsTTY) {
  io.write('Interactive terminal detected\n');
}

// Use style for coloring
io.write(style.hex('#ff6600', 'Orange text\n'));
```

## Resize Events

The Node.js adapter listens to terminal resize via `process.stdout`:

```typescript
const io = nodeIO();

const handle = io.onResize((cols, rows) => {
  console.log(`Terminal resized to ${cols}x${rows}`);
});

// Clean up when done
handle.dispose();
```

In TUI apps using `@flyingrobots/bijou-tui`, resize events are dispatched automatically as `ResizeMsg` — you don't need to set this up manually.

## Environment Variables

| Variable | Effect |
|---|---|
| `NO_COLOR` | Disables all color output |
| `FORCE_COLOR` | Forces color even in non-TTY |
| `CI` | Switches to static output mode |
| `TERM=dumb` | Switches to pipe output mode |
| `BIJOU_ACCESSIBLE=1` | Enables accessible output mode |
| `BIJOU_THEME=./path.json` | Loads a custom DTCG theme file |
