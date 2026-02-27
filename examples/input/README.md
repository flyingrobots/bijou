# `input()`

Text input with validation

![demo](demo.gif)

## Run

```sh
npx tsx examples/input/main.ts
```

## Code

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { input, badge } from '@flyingrobots/bijou';

const ctx = initDefaultContext();

async function main() {
  const name = await input({
    title: 'Project name:',
    placeholder: 'my-project',
    required: true,
    validate: (value) => {
      if (/[A-Z]/.test(value)) return { valid: false, message: 'Must be lowercase' };
      if (/\s/.test(value)) return { valid: false, message: 'No spaces allowed' };
      return { valid: true };
    },
    ctx,
  });

  console.log();

  const description = await input({
    title: 'Description:',
    placeholder: 'A short description of your project',
    ctx,
  });

  console.log();
  console.log(badge('CREATED', { variant: 'success', ctx }), ` ${name} — ${description || '(no description)'}`);
}

main().catch(console.error);
```
