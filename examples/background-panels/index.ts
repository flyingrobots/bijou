import { ctx } from '../_shared/setup.js';
import { box, separator } from '@flyingrobots/bijou';
import { flex, modal, toast, composite } from '@flyingrobots/bijou-tui';

const { theme } = ctx.theme;

// ---------------------------------------------------------------------------
// 1. box() with bgToken — a colored panel
// ---------------------------------------------------------------------------

console.log(separator({ label: 'box() with bgToken', ctx }));
console.log();

console.log(box('This box has a background fill.\nIt creates a solid colored block.', {
  bgToken: theme.surface.primary,
  padding: { top: 1, bottom: 1, left: 2, right: 2 },
  width: 44,
  ctx,
}));
console.log();

// ---------------------------------------------------------------------------
// 2. flex() with per-child bg — multiple colored regions
// ---------------------------------------------------------------------------

console.log(separator({ label: 'flex() with per-child bg', ctx }));
console.log();

console.log(flex(
  { direction: 'row', width: 60, height: 5, gap: 1, bg: theme.surface.muted },
  { basis: 20, bg: theme.surface.primary, content: ' Primary' },
  { basis: 20, bg: theme.surface.secondary, content: ' Secondary' },
  { flex: 1, bg: theme.surface.elevated, content: ' Elevated' },
));
console.log();

// ---------------------------------------------------------------------------
// 3. modal() with bgToken over dimmed content
// ---------------------------------------------------------------------------

console.log(separator({ label: 'modal() with bgToken', ctx }));
console.log();

const bg = Array.from({ length: 12 }, (_, i) =>
  `  ${'·'.repeat(56)}  line ${String(i + 1).padStart(2)}`
).join('\n');

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
console.log();

// ---------------------------------------------------------------------------
// 4. toast() with bgToken
// ---------------------------------------------------------------------------

console.log(separator({ label: 'toast() with bgToken', ctx }));
console.log();

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
console.log();
