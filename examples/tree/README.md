# `tree()`

Hierarchical tree views

![demo](demo.gif)

## Run

```sh
npx tsx examples/tree/main.ts
```

## Code

```typescript
import { ctx } from '../_shared/setup.js';
import { tree, separator } from '@flyingrobots/bijou';

console.log(separator({ label: 'project structure', ctx }));
console.log();

console.log(tree([
  { label: 'src', children: [
    { label: 'components', children: [
      { label: 'box.ts' },
      { label: 'table.ts' },
      { label: 'tree.ts' },
    ]},
    { label: 'forms', children: [
      { label: 'input.ts' },
      { label: 'select.ts' },
    ]},
    { label: 'theme', children: [
      { label: 'tokens.ts' },
      { label: 'presets.ts' },
      { label: 'gradient.ts' },
    ]},
    { label: 'index.ts' },
  ]},
  { label: 'tests', children: [
    { label: 'components.test.ts' },
    { label: 'theme.test.ts' },
  ]},
  { label: 'package.json' },
  { label: 'tsconfig.json' },
], { ctx }));

console.log();
console.log(separator({ label: 'dependency tree', ctx }));
console.log();

console.log(tree([
  { label: '@flyingrobots/bijou-node', children: [
    { label: '@flyingrobots/bijou', children: [
      { label: '(zero dependencies)' },
    ]},
    { label: 'chalk@5.6.2', children: [
      { label: '#ansi-styles@6.2.1' },
      { label: '#supports-color@9.4.0' },
    ]},
  ]},
  { label: '@flyingrobots/bijou-tui', children: [
    { label: '@flyingrobots/bijou' },
  ]},
], { ctx }));
```
