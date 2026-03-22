# `statusBar()`, `statusBarSurface()`

Segmented shell status rails

## Run

```sh
npx tsx examples/status-bar/main.ts
```

## Use this when

- shell chrome needs concise global state, mode, or position cues
- the app already composes shell output as a structured `Surface`
- the information belongs at the shell edge rather than in page content

## Choose something else when

- choose notifications for transient events, warnings, and follow-up
- choose page content or `alert()` when the text is explanatory or durable

## Code

```typescript
import { ctx } from '../_shared/setup.js';
import { separatorSurface } from '@flyingrobots/bijou';
import { statusBarSurface } from '@flyingrobots/bijou-tui';
import { column, line, renderSurface } from '../_shared/example-surfaces.ts';

const surface = column([
  line(''),
  separatorSurface({ label: 'status bar examples', ctx }),
  line(''),
  statusBarSurface({ left: 'main.ts', center: 'TypeScript', right: 'Ln 42, Col 8', width: 60 }),
  line(''),
  statusBarSurface({ left: 'NORMAL', right: '1/150', width: 60, fillChar: '─' }),
  line(''),
  statusBarSurface({ left: '⏺ Recording', center: '00:12', right: '🔴 LIVE', width: 60 }),
]);

console.log(renderSurface(surface, ctx));
```

Use `statusBarSurface()` when shell chrome is already part of a structured `Surface` composition path. Keep `statusBar()` for explicit text output, logs, or other lowering boundaries where a plain string is still the right artifact.

[← Examples](../README.md)
