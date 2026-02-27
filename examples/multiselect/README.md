# `multiselect()`

Checkbox multi-select

![demo](demo.gif)

## Run

```sh
npx tsx examples/multiselect/main.ts
```

## Code

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { multiselect, badge } from '@flyingrobots/bijou';

const ctx = initDefaultContext();

async function main() {
  const features = await multiselect({
    title: 'Enable features:',
    options: [
      { label: 'TypeScript', value: 'typescript', description: 'Type-safe JavaScript' },
      { label: 'ESLint', value: 'eslint', description: 'Code linting' },
      { label: 'Prettier', value: 'prettier', description: 'Code formatting' },
      { label: 'Vitest', value: 'vitest', description: 'Unit testing' },
      { label: 'Playwright', value: 'playwright', description: 'E2E testing' },
      { label: 'GitHub Actions', value: 'ci', description: 'CI/CD pipeline' },
      { label: 'Docker', value: 'docker', description: 'Containerization' },
      { label: 'Husky', value: 'husky', description: 'Git hooks' },
    ],
    ctx,
  });

  console.log();
  if (features.length === 0) {
    console.log('No features selected.');
  } else {
    console.log('Enabled:', features.map(f => badge(f, { variant: 'accent', ctx })).join(' '));
  }
}

main().catch(console.error);
```
