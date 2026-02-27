# `confirm()`

Yes/no confirmation prompt

![demo](demo.gif)

## Run

```sh
npx tsx examples/confirm/main.ts
```

## Code

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { confirm, badge } from '@flyingrobots/bijou';

const ctx = initDefaultContext();

async function main() {
  const deploy = await confirm({ title: 'Deploy to production?', defaultValue: false, ctx });
  console.log();

  if (deploy) {
    console.log(badge('YES', { variant: 'success', ctx }), ' Deploying now...');
  } else {
    console.log(badge('NO', { variant: 'muted', ctx }), ' Deploy cancelled.');
  }
}

main().catch(console.error);
```
