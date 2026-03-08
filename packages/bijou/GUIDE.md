# Guide — @flyingrobots/bijou

## Setup

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node
```

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, headerBox, table, badge, spinner } from '@flyingrobots/bijou';

initDefaultContext();
```

`initDefaultContext()` auto-detects your environment (TTY, CI, pipe, NO_COLOR) and sets the global context. All components use it automatically.

## Components

Every component returns a string. Print it however you like — `console.log`, `process.stdout.write`, or pass it to another component.

### Layout

```typescript
// Simple box
console.log(box('Hello, world!'));

// Box with header
console.log(headerBox('Deploy', { detail: 'v2.1.0 → production' }));

// Separator
console.log(separator('Section Title'));
```

### Tables

```typescript
const data = [
  { name: 'api', status: 'Active' },
  { name: 'worker', status: 'Pending' },
];

console.log(table(data, {
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
  ],
}));
```

### Progress & Spinners

```typescript
// Static progress bar frame
console.log(progressBar(75));

// Live spinner
const spin = createSpinner({ label: 'Installing...' });
spin.start();
// ... later
spin.stop('Done!');

// Live progress bar with smooth interpolation
const bar = createAnimatedProgressBar({ duration: 300 });
bar.start();
bar.update(50);
bar.update(100);
bar.stop('Complete!');
```

### Forms

```typescript
const name = await input({ message: 'Your name:' });
const framework = await select({
  message: 'Pick a framework:',
  options: [
    { label: 'Next.js', value: 'next' },
    { label: 'Remix', value: 'remix' },
  ],
});
const confirmed = await confirm({ message: 'Continue?' });
```

Forms degrade automatically:
- **Interactive**: Arrow-key navigation, real-time rendering
- **Pipe/CI**: Numbered list, line-buffered input
- **Accessible**: Screen-reader friendly prompts

## Themes

### Built-in Presets

`cyan-magenta` (default), `nord`, `catppuccin`.

### Custom Themes via Environment

```bash
BIJOU_THEME=./themes/my-brand.json node my-cli.js
```

### Extending Themes in Code

```typescript
import { extendTheme, tv, CYAN_MAGENTA } from '@flyingrobots/bijou';

const myTheme = extendTheme(CYAN_MAGENTA, {
  status: {
    DEPLOYED: tv('#34d399'),
    CANCELLED: tv('#6b7280', ['strikethrough']),
  },
  ui: {
    clusterName: tv('#60a5fa', ['bold']),
  },
});
```

### Text Modifiers

Token values accept an array of modifiers: `'bold'`, `'dim'`, `'strikethrough'`, `'inverse'`, `'underline'`, `'curly-underline'`, `'dotted-underline'`, `'dashed-underline'`.

```typescript
tv('#ff0000', ['bold'])                    // bold red
tv('#808080', ['dim', 'strikethrough'])    // dimmed strikethrough
tv('#00aaff', ['underline'])               // standard underline
tv('#ff6600', ['curly-underline'])         // wavy underline (kitty, iTerm2, WezTerm, Windows Terminal)
tv('#00ff00', ['dotted-underline'])        // dotted underline
tv('#ffaa00', ['dashed-underline'])        // dashed underline
```

### Looking Up Tokens

Use semantic helpers on the context to look up tokens without coupling to theme object structure:

```typescript
const primary = ctx.semantic('primary');
const border = ctx.border('muted');
const bg = ctx.surface('secondary');
const status = ctx.status('success'); // falls back to 'muted' if missing
const icon = ctx.ui('cursor');
```

### DTCG Interop

```typescript
import { fromDTCG, toDTCG } from '@flyingrobots/bijou';

// Load from Tokens Studio / Style Dictionary JSON
const theme = fromDTCG(jsonDocument);

// Export back to DTCG format
const doc = toDTCG(theme);
```

## Custom Components

Build your own mode-aware components using the `renderByMode` dispatcher:

```typescript
import type { BijouContext } from '@flyingrobots/bijou';
import { renderByMode, resolveCtx } from '@flyingrobots/bijou';

export function myComponent(
  text: string,
  options: { ctx?: BijouContext } = {},
) {
  const ctx = resolveCtx(options.ctx);

  return renderByMode(ctx.mode, {
    pipe: () => `[${text}]`,
    accessible: () => `Component: ${text}`,
    interactive: () => {
      const token = ctx.semantic('accent');
      return ctx.style.styled(token, `\u2728 ${text}`);
    }
  }, options);
}
```

The dispatcher automatically handles mode selection and fallback logic (e.g. `static` falls back to `interactive` by default).

## Testing

Use the test adapters — no mocks, no process globals:

```typescript
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { box, badge } from '@flyingrobots/bijou';

// Test interactive mode
const ctx = createTestContext({ mode: 'interactive' });
const result = box('hello', { ctx });
expect(result).toContain('┌');
expect(result).toContain('hello');

// Test pipe mode (graceful degradation)
const pipeCtx = createTestContext({ mode: 'pipe' });
const plain = box('hello', { ctx: pipeCtx });
expect(plain).toBe('hello');

// Test across all modes
for (const mode of ['interactive', 'static', 'pipe', 'accessible'] as const) {
  const ctx = createTestContext({ mode });
  const result = badge('OK', { variant: 'success', ctx });
  expect(result).toContain('OK');
}
```

## Output Modes

Every component checks `ctx.mode` and adapts:

| Mode | When | What happens |
|------|------|-------------|
| `interactive` | TTY detected | Full RGB colors, unicode borders, animations |
| `static` | `CI=true` | Single-frame rendering, no animations |
| `pipe` | Piped stdout or `TERM=dumb` | Plain text, ASCII only |
| `accessible` | `BIJOU_ACCESSIBLE=1` | Screen-reader friendly descriptions |

You never need to handle this manually — components degrade automatically.
