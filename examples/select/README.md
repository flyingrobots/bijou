# `select()`

Single-select menu

![demo](demo.gif)

## Run

```sh
npx tsx examples/select/main.ts
```

## Code

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { select, badge } from '@flyingrobots/bijou';

const ctx = initDefaultContext();

async function main() {
  const manager = await select({
    title: 'Choose a package manager:',
    options: [
      { label: 'npm', value: 'npm', description: 'Node Package Manager' },
      { label: 'yarn', value: 'yarn', description: 'Fast, reliable, and secure' },
      { label: 'pnpm', value: 'pnpm', description: 'Fast, disk space efficient' },
      { label: 'bun', value: 'bun', description: 'All-in-one JavaScript runtime' },
      { label: 'deno', value: 'deno', description: 'Secure runtime for JS and TS' },
      { label: 'none', value: 'none', description: 'I\'ll manage dependencies myself' },
    ],
    ctx,
  });

  console.log();
  console.log('Selected:', badge(manager.toUpperCase(), { variant: 'primary', ctx }));
}

main().catch(console.error);
```

[← Examples](../README.md)
