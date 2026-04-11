# Background fill regression in v4.4.0

**Reporter:** Think repo (downstream consumer)
**Bijou version:** 4.4.0 (worked in 4.2.0)
**Date:** 2026-04-11

## What broke

The Think browse TUI uses `createFramedApp` + `run()` with a custom
theme that sets a plum background (#2d1922). After upgrading from bijou
4.2.0 to 4.4.0, the background fill no longer renders — the terminal
shows a plain black background instead of the themed plum.

## RE-017 workaround context

Think has a standing workaround (RE-017) for "frame doesn't fill
surface.primary.bg". Before calling `run()`, Think writes a raw ANSI
escape to set the terminal background color:

```js
process.stdout.write(`\x1b[48;2;${BG[0]};${BG[1]};${BG[2]}m`);
await run(app, { ctx });
```

This workaround worked on bijou 4.2.0 but stopped working on 4.4.0.

## Suspected cause

The v4.4.0 zero-alloc frame chrome changes (`paintStyledTextSurfaceWithBCSS`
repaint-in-place for header/footer) may have changed how the frame
clears or fills the screen on entry, overriding the pre-set terminal
background color.

## How to reproduce

Minimal reproduction:

```js
import { createBijou } from '@flyingrobots/bijou';
import { nodeRuntime, nodeIO, chalkStyle } from '@flyingrobots/bijou-node';
import { createFramedApp, run } from '@flyingrobots/bijou-tui';
import { tv } from '@flyingrobots/bijou';

const theme = {
  name: 'repro',
  surface: {
    primary: { hex: '#fffcc9', bg: '#2d1922' },   // cream on dark plum
    secondary: { hex: '#fffcc9', bg: '#3a2230' },
    elevated: { hex: '#fffcc9', bg: '#46293a' },
    overlay: { hex: '#fffcc9', bg: '#2d1922' },
    muted: { hex: '#7b5770', bg: '#1e1018' },
  },
  semantic: {
    accent: tv('#41b797'),
    muted: tv('#7b5770'),
    primary: tv('#fffcc9', ['bold']),
  },
  status: {},
  border: { primary: tv('#7b5770') },
  ui: {},
};

const ctx = createBijou({
  runtime: nodeRuntime(),
  io: nodeIO(),
  style: chalkStyle(),
  theme,
});

const app = createFramedApp({
  pages: [{
    id: 'test',
    title: 'BG TEST',
    init: () => [{ text: 'Hello' }, []],
    update: (msg, model) => [model, []],
    layout: (model) => ({
      kind: 'pane',
      paneId: 'main',
      render: (w, h) => model.text,
    }),
  }],
});

// RE-017 workaround: set terminal bg before run()
process.stdout.write('\x1b[48;2;45;25;34m');

await run(app, { ctx });
```

**Expected:** Terminal background is dark plum (#2d1922).
**Actual on 4.4.0:** Terminal background is black.
**Actual on 4.2.0:** Terminal background is dark plum (correct).

## What should happen

The framed app should fill the terminal with the theme's primary
background color, or at minimum the RE-017 pre-set bg should survive
the `run()` initialization.

## Files in Think

- `src/browse-tui/app.js` — RE-017 workaround at line 85
- `src/browse-tui/theme.js` — full theme definition with plum bg
- `src/browse-tui/style.js` — palette with bg: [45, 25, 34]
