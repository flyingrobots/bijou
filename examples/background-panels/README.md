# Background Panels

Demonstrates background color support on `box()`, `flex()`, `modal()`, and `toast()` using surface tokens.

## Run

```sh
npx tsx examples/background-panels/index.ts
```

## Code

```typescript
import { ctx } from '../_shared/setup.js';
import { box, separator } from '@flyingrobots/bijou';
import { flex, modal, toast, composite } from '@flyingrobots/bijou-tui';

const { theme } = ctx.theme;

// 1. box() with bgToken — a colored panel
console.log(box('This box has a background fill.', {
  bgToken: theme.surface.primary,
  padding: { top: 1, bottom: 1, left: 2, right: 2 },
  width: 44,
  ctx,
}));

// 2. flex() with per-child bg — multiple colored regions
console.log(flex(
  { direction: 'row', width: 60, height: 5, gap: 1, bg: theme.surface.muted },
  { basis: 20, bg: theme.surface.primary, content: ' Primary' },
  { basis: 20, bg: theme.surface.secondary, content: ' Secondary' },
  { flex: 1, bg: theme.surface.elevated, content: ' Elevated' },
));

// 3. modal() with bgToken over dimmed content
const bg = Array.from({ length: 12 }, () => '·'.repeat(56)).join('\n');
const m = modal({
  title: 'Confirm',
  body: 'Delete this item?',
  hint: 'y/n',
  screenWidth: 64,
  screenHeight: 12,
  bgToken: theme.surface.overlay,
  borderToken: theme.border.primary,
  ctx,
});
console.log(composite(bg, [m], { dim: true }));

// 4. toast() with bgToken
const toastBg = Array.from({ length: 6 }, () => '·'.repeat(64)).join('\n');
const t = toast({
  message: 'Changes saved',
  variant: 'success',
  screenWidth: 64,
  screenHeight: 6,
  bgToken: theme.surface.elevated,
  ctx,
});
console.log(composite(toastBg, [t]));
```

[← Examples](../README.md)
