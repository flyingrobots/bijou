# `markdown()`

Renders a subset of CommonMark that adapts to the terminal's output mode — styled in interactive mode, plain in pipe mode, and screen-reader-friendly in accessible mode.

## Prerequisites

- Node.js 18+
- `pnpm install` from the repo root

## Run

```sh
npx tsx examples/markdown/main.ts
```

Pipe mode output (no ANSI styling):

```sh
npx tsx examples/markdown/main.ts | cat
```

## Code

The example initializes a `BijouContext` via `initDefaultContext()` — this detects the terminal's capabilities (TTY, color support, screen reader) and configures the styling engine accordingly. All bijou components accept `ctx` to render mode-appropriate output.

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { markdown, box } from '@flyingrobots/bijou';

const ctx = initDefaultContext();

const SOURCE = `
# Bijou Markdown

**Bijou** supports a subset of CommonMark that degrades gracefully across terminal modes.

## Features

- **Inline formatting**: **bold**, *italic*, and \`code spans\`
- **Lists**: bulleted and numbered
- **Links**: [GitHub](https://github.com/flyingrobots/bijou)
- **Blocks**:
  > Blockquotes for highlights
  \`\`\`ts
  console.log("Fenced code blocks");
  \`\`\`

---

### Why use it?

It allows you to ship documentation or help text that looks great in a TTY but remains readable when piped to a file or a screen reader.
`;

console.log(box(markdown(SOURCE, { ctx }), { padding: { top: 1, bottom: 1, left: 2, right: 2 } }));
```

[← Examples](../README.md)
