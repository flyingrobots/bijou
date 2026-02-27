# `detectOutputMode()`

Same components in interactive/pipe/accessible mode

![demo](demo.gif)

## Run

```sh
npx tsx examples/pipe/main.ts
```

## Code

```typescript
import { createNodeContext } from '@flyingrobots/bijou-node';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  box, headerBox, badge, alert, table, progressBar, separator,
  setDefaultContext,
} from '@flyingrobots/bijou';
import type { BijouContext } from '@flyingrobots/bijou';

// Render the same components in each output mode for comparison.

function renderSample(label: string, ctx: BijouContext): string {
  const lines: string[] = [];

  lines.push(separator({ label, width: 40, ctx }));
  lines.push('');
  lines.push(box('Hello, bijou!', { ctx }));
  lines.push('');
  lines.push(headerBox('Deploy', { detail: 'v1.2.3', ctx }));
  lines.push('');
  lines.push([
    badge('OK', { variant: 'success', ctx }),
    badge('FAIL', { variant: 'error', ctx }),
  ].join(' '));
  lines.push('');
  lines.push(alert('Build passed.', { variant: 'success', ctx }));
  lines.push('');
  lines.push(table({
    columns: [{ header: 'Name' }, { header: 'Value' }],
    rows: [['port', '3000'], ['host', 'localhost']],
    ctx,
  }));
  lines.push('');
  lines.push(progressBar(75, { width: 30, showPercent: true, ctx }));

  return lines.join('\n');
}

// Create contexts for each mode
const interactive = createTestContext({ mode: 'interactive' });
const pipe = createTestContext({ mode: 'pipe' });
const accessible = createTestContext({ mode: 'accessible' });

// Use the real node context for actual output
const nodeCtx = createNodeContext();
setDefaultContext(nodeCtx);

console.log(renderSample('interactive', interactive));
console.log();
console.log(renderSample('pipe', pipe));
console.log();
console.log(renderSample('accessible', accessible));
```

[← Examples](../README.md)
