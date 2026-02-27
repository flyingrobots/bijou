# `accordion()`

Expandable content sections

![demo](demo.gif)

## Run

```sh
npx tsx examples/accordion/main.ts
```

## Code

```typescript
import { ctx } from '../_shared/setup.js';
import { accordion } from '@flyingrobots/bijou';

console.log(accordion([
  {
    title: 'What is bijou?',
    content: 'A physics-powered TUI engine for TypeScript.\nZero-dependency core with hexagonal architecture.',
    expanded: true,
  },
  {
    title: 'Installation',
    content: 'npm install @flyingrobots/bijou @flyingrobots/bijou-node',
    expanded: true,
  },
  {
    title: 'Configuration',
    content: 'Set BIJOU_THEME env var to choose a preset.\nSupported: cyan-magenta, teal-orange-pink, nord, catppuccin.',
  },
  {
    title: 'API Reference',
    content: 'See the README for full documentation and examples.',
  },
], { ctx }));
```

[← Examples](../README.md)
