# `group()`

Multi-field form wizard

![demo](demo.gif)

## Run

```sh
npx tsx examples/form-group/main.ts
```

## Code

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { group, input, select, multiselect, confirm, separator, box } from '@flyingrobots/bijou';

const ctx = initDefaultContext();

async function main() {
  console.log(separator({ label: 'Project Setup', ctx }));
  console.log();

  const result = await group({
    name: () => input({
      title: 'Project name:',
      placeholder: 'my-app',
      required: true,
      ctx,
    }),
    framework: () => select({
      title: 'Framework:',
      options: [
        { label: 'Express', value: 'express' },
        { label: 'Fastify', value: 'fastify' },
        { label: 'Hono', value: 'hono' },
        { label: 'None', value: 'none' },
      ],
      ctx,
    }),
    features: () => multiselect({
      title: 'Features:',
      options: [
        { label: 'TypeScript', value: 'typescript' },
        { label: 'ESLint', value: 'eslint' },
        { label: 'Docker', value: 'docker' },
      ],
      ctx,
    }),
    deploy: () => confirm({
      title: 'Set up deployment?',
      defaultValue: true,
      ctx,
    }),
  });

  console.log();
  console.log(separator({ label: 'Summary', ctx }));
  console.log();

  if (result.cancelled) {
    console.log('Setup cancelled.');
    return;
  }

  const summary = [
    `Name:       ${result.values.name}`,
    `Framework:  ${result.values.framework}`,
    `Features:   ${result.values.features.join(', ') || 'none'}`,
    `Deploy:     ${result.values.deploy ? 'yes' : 'no'}`,
  ].join('\n');

  console.log(box(summary, { ctx }));
}

main().catch(console.error);
```
