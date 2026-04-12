# Guide — @flyingrobots/bijou

This guide covers the productive-fast path for the core package.

For render-path doctrine, byte-packed surface expectations, token-graph work, custom mode-aware components, and the deeper component-family lanes, use [ADVANCED_GUIDE.md](./ADVANCED_GUIDE.md).

## Setup

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node
```

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, headerBox, table, badge } from '@flyingrobots/bijou';

initDefaultContext();
```

`initDefaultContext()` auto-detects your environment (TTY, CI, pipe, NO_COLOR) and sets the global context. All components use it automatically.

## Output Modes

Every component checks `ctx.mode` and adapts its rendering:

| Mode | Trigger | Behavior |
| :--- | :--- | :--- |
| **`interactive`** | TTY detected | Full RGB colors, Unicode borders, animations. |
| **`static`** | `CI=true` | Single-frame rendering; no animations. |
| **`pipe`** | Piped stdout or `TERM=dumb` | Plain text, ASCII-only fallback. |
| **`accessible`** | `BIJOU_ACCESSIBLE=1` | Linearized, screen-reader-friendly output. |

## Components: String vs. Surface

Bijou provides two primary output formats:

1. **String-first**: Returns a themed ANSI string. Best for standalone CLIs and scripts.
2. **Surface-first**: Returns a `Surface` (byte-buffer). Best for high-performance TUIs and complex layouts.

### Choosing Feedback Surfaces
- **`badge()`**: Compact, inline status.
- **`note()`**: Explanatory, non-urgent supporting text.
- **`alert()`**: Persistent message that stays in the document flow.
- **`markdown()`**: Renders formatted prose with mode-aware fallbacks.

### Choosing Prompts
- **`input()`**: Raw text entry.
- **`select()`**: Single choice from a stable list.
- **`filter()`**: Search-led choice from a large or dynamic set.
- **`multiselect()`**: Choosing multiple values to build a set.
- **`confirm()`**: Strictly binary (yes/no) decisions.

### Layout & Containers
- **`box()` / `boxSurface()`**: Visible containment with optional titles.
- **`headerBox()`**: Region with a title and a detail line.
- **`separator()`**: Section divider with an optional label.

### Data & Hierarchy
- **`table()` / `tableSurface()`**: Passive row/column comparison.
- **`tree()`**: Parent/child nesting.
- **`timeline()`**: Chronological sequences.
- **`dag()` / `dagSlice()`**: Causal or dependency-based graphs.

### Progress & Loading
- **`progressBar()`**: Determinate completion.
- **`spinnerFrame()`**: Indeterminate activity.
- **`skeleton()`**: Short-lived loading placeholders.

## Themes

### Presets
`cyan-magenta` (default), `nord`, `catppuccin`.

### Lookups
Use semantic helpers on the context to avoid coupling to theme structure:
```typescript
const primary = ctx.semantic('primary');
const border = ctx.border('muted');
const success = ctx.status('success');
```

## Custom Components

Build mode-aware components using the `renderByMode` dispatcher:

```typescript
import { renderByMode, resolveCtx, type BijouContext } from '@flyingrobots/bijou';

export function myComponent(text: string, options: { ctx?: BijouContext } = {}) {
  const ctx = resolveCtx(options.ctx);
  return renderByMode(ctx.mode, {
    pipe: () => `[${text}]`,
    interactive: () => ctx.style.styled(ctx.semantic('accent'), `✨ ${text}`),
  }, options);
}
```

## Testing

Use `createTestContext` to verify behavior across all modes without mocking:

```typescript
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { box } from '@flyingrobots/bijou';

const ctx = createTestContext({ mode: 'pipe' });
const result = box('hello', { ctx });
expect(result).toBe('hello'); // In pipe mode, boxes are stripped.
```
