# `textarea()`

Multi-line text input with cursor navigation

![demo](demo.gif)

## Run

```sh
npx tsx examples/textarea/main.ts
```

## Code

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { textarea, headerBox } from '@flyingrobots/bijou';

const ctx = initDefaultContext();

async function main() {
  const message = await textarea({
    title: 'Write a commit message:',
    placeholder: 'Describe your changes...',
    showLineNumbers: true,
    height: 8,
    ctx,
  });

  if (message != null) {
    console.log();
    console.log(headerBox('Commit Message', { detail: message, ctx }));
  } else {
    console.log('\nCancelled.');
  }
}

main().catch(console.error);
```

[← Examples](../README.md)
