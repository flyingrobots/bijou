# @flyingrobots/bijou-tui

TEA runtime for terminal UIs — model/update/view with keyboard input, alt screen, and layout helpers.

Inspired by [Bubble Tea](https://github.com/charmbracelet/bubbletea) (Go), bijou-tui brings The Elm Architecture to TypeScript terminals.

## Install

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-tui
```

## Quick Start

```typescript
import { run, quit, tick, type App, type KeyMsg } from '@flyingrobots/bijou-tui';

type Model = { count: number };

const app: App<Model> = {
  init: () => [{ count: 0 }, tick(1000)],

  update: (msg, model) => {
    if (msg.type === 'key') {
      if (msg.key === 'q') return [model, quit()];
      if (msg.key === '+') return [{ count: model.count + 1 }, null];
      if (msg.key === '-') return [{ count: model.count - 1 }, null];
    }
    if (msg.type === 'tick') {
      return [model, tick(1000)];
    }
    return [model, null];
  },

  view: (model) => `Count: ${model.count}\n\nPress +/- to change, q to quit`,
};

run(app);
```

## API

### Core Types

- **`App<M>`** — defines `init`, `update(msg, model)`, and `view(model)` functions
- **`KeyMsg`** — keyboard input message with `key`, `ctrl`, `shift`, `alt` fields
- **`Cmd`** — side-effect commands returned from `update`
- **`QUIT`** — sentinel value to signal app termination

### Commands

- **`quit()`** — exit the app
- **`tick(ms)`** — schedule a tick after `ms` milliseconds
- **`batch(...cmds)`** — combine multiple commands

### Screen Control

- **`enterScreen()` / `exitScreen()`** — alt screen buffer management
- **`clearAndHome()`** — clear screen and move cursor to top-left
- **`renderFrame(content)`** — efficient frame rendering

### Layout

- **`vstack(...lines)`** — vertical stack (join with newlines)
- **`hstack(...cols)`** — horizontal stack (side-by-side columns)

### Key Parsing

- **`parseKey(data)`** — parse raw stdin bytes into a `KeyMsg`

## Related Packages

- [`@flyingrobots/bijou`](https://www.npmjs.com/package/@flyingrobots/bijou) — Zero-dependency core with all components and theme engine
- [`@flyingrobots/bijou-node`](https://www.npmjs.com/package/@flyingrobots/bijou-node) — Node.js runtime adapter (chalk, readline, process)

## License

MIT
