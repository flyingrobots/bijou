---
title: RE-017 — Frame does not fill terminal background with surface.primary.bg
lane: retro
---

# RE-017 — Frame does not fill terminal background with surface.primary.bg

## Disposition

Fixed in the `v4.4.1` release line and already shipped on `main` at tag `v4.4.1`. The frame now fills the body and shell chrome with the active shell background, the stock `shellThemes` path exercises that end to end, and the `RE-017` DOGFOOD cycle coverage plus the 4.4.1 release docs are the source of truth now.

## Original Proposal

Legend: [RE — Runtime Engine](../legends/RE-runtime-engine.md)

## Problem

When a custom theme defines `surface.primary.bg` (e.g., `#2d1922` for a dark plum background), the framed shell does not fill the terminal background with that color. Empty cells in pane content retain the terminal's default background instead of the theme's surface background.

The frame correctly reads `surface('primary').bg` for header tab color derivation (in `deriveActiveHeaderTabToken`), but it does not fill the pane area's empty cells with the surface background. This means custom themes that rely on a non-default background color appear broken — only styled text shows the theme colors while the rest of the screen shows the terminal's default dark background.

## Expected behavior

The frame should fill all empty/unoccupied cells in the viewport with `ctx.surface('primary').bg` so that custom themes with non-default backgrounds render correctly across the entire terminal.

## Reproduction

```js
import { createBijou, tv } from '@flyingrobots/bijou';
import { createFramedApp, run } from '@flyingrobots/bijou-tui';

const theme = {
  name: 'custom',
  // ... standard tokens ...
  surface: {
    primary: { hex: '#ffffff', bg: '#2d1922' },  // dark plum background
    // ...
  },
};

const ctx = createBijou({ runtime, io, style, theme });
const app = createFramedApp({ pages: [...] });
await run(app, { ctx });
// Expected: entire terminal has #2d1922 background
// Actual: only styled text areas show theme colors; empty areas show terminal default
```

## Workaround

Write the ANSI background escape code directly to stdout before `run()` starts, and clear the screen:

```js
process.stdout.write(`\x1b[48;2;45;25;34m\x1b[2J`);
await run(app, { ctx });
```

This survives bijou's alt screen enter but may flash briefly.
