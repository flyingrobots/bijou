# `kbd()`

Keyboard shortcut display

![demo](demo.gif)

## Run

```sh
npx tsx examples/kbd/main.ts
```

## Code

```typescript
import { ctx } from '../_shared/setup.js';
import { kbd, separator } from '@flyingrobots/bijou';

console.log(separator({ label: 'keyboard shortcuts', ctx }));
console.log();

// Single keys
console.log(kbd('Enter', { ctx }), ' Select');
console.log(kbd('Esc', { ctx }), '   Cancel');
console.log(kbd('?', { ctx }), '     Help');
console.log();

// Arrow keys
console.log(kbd('↑', { ctx }), kbd('↓', { ctx }), ' Navigate');
console.log(kbd('←', { ctx }), kbd('→', { ctx }), ' Switch tabs');
console.log();

// Chords
console.log(kbd('Ctrl', { ctx }), '+', kbd('C', { ctx }), '  Quit');
console.log(kbd('Ctrl', { ctx }), '+', kbd('S', { ctx }), '  Save');
console.log(kbd('Cmd', { ctx }), '+', kbd('Shift', { ctx }), '+', kbd('P', { ctx }), '  Command palette');
```
