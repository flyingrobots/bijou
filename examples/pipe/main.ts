import { createNodeContext } from '@flyingrobots/bijou-node';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  box,
  headerBox,
  alert,
  table,
  progressBar,
  separatorSurface,
  setDefaultContext,
} from '@flyingrobots/bijou';
import type { BijouContext } from '@flyingrobots/bijou';
import {
  badgeSurface,
  column,
  contentSurface,
  renderSurface,
  row,
  spacer,
} from '../_shared/example-surfaces.ts';

// Render the same components in each output mode for comparison.

function renderSample(label: string, ctx: BijouContext): string {
  return renderSurface(column([
    separatorSurface({ label, width: 40, ctx }),
    spacer(1, 1),
    contentSurface(box('Hello, bijou!', { ctx })),
    spacer(1, 1),
    contentSurface(headerBox('Deploy', { detail: 'v1.2.3', ctx })),
    spacer(1, 1),
    row([
      badgeSurface('OK', 'success', ctx),
      ' ',
      badgeSurface('FAIL', 'error', ctx),
    ]),
    spacer(1, 1),
    contentSurface(alert('Build passed.', { variant: 'success', ctx })),
    spacer(1, 1),
    contentSurface(table({
      columns: [{ header: 'Name' }, { header: 'Value' }],
      rows: [['port', '3000'], ['host', 'localhost']],
      ctx,
    })),
    spacer(1, 1),
    contentSurface(progressBar(75, { width: 30, showPercent: true, ctx })),
  ]), ctx);
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
