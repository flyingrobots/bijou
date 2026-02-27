# `stepper()`

Step progress indicators

![demo](demo.gif)

## Run

```sh
npx tsx examples/stepper/main.ts
```

## Code

```typescript
import { ctx } from '../_shared/setup.js';
import { stepper, separator } from '@flyingrobots/bijou';

console.log(separator({ label: 'deployment pipeline', ctx }));
console.log();

console.log(stepper(
  [
    { label: 'Build' },
    { label: 'Test' },
    { label: 'Review' },
    { label: 'Stage' },
    { label: 'Deploy' },
  ],
  { current: 2, ctx },
));

console.log();
console.log(separator({ label: 'onboarding wizard', ctx }));
console.log();

console.log(stepper(
  [
    { label: 'Account' },
    { label: 'Profile' },
    { label: 'Preferences' },
    { label: 'Done' },
  ],
  { current: 0, ctx },
));

console.log();

console.log(stepper(
  [
    { label: 'Account' },
    { label: 'Profile' },
    { label: 'Preferences' },
    { label: 'Done' },
  ],
  { current: 3, ctx },
));
```

[← Examples](../README.md)
