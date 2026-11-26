import { createHash } from 'node:crypto';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { surfaceToString } from '@flyingrobots/bijou';
import { runScript } from '@flyingrobots/bijou-tui';
import { createSoakApp } from './soak-app.js';
import type { SoakHost } from './soak-ports.js';

export const ctx = createTestContext();
const steps = (perfOff: boolean) => [
  ...(perfOff ? [{ key: '`' }] : []),
  ...Array.from({ length: 400 }, () => ({ pulse: { dt: 0.05 } })),
];
// Only the scenario's own pixels (top 16 rows, left 46 columns) are compared:
// the perf panel, help line and framework toast carry wall-clock and memory.
export const signature = (frame: Parameters<typeof surfaceToString>[0]): string =>
  createHash('sha256').update(surfaceToString(frame, ctx.style).split('\n').slice(0, 16).map((l) => l.slice(0, 46)).join('\n')).digest('hex').slice(0, 16);
export const scenarioContext = () => createTestContext({ mode: 'interactive' });
export const NO_LOG = (): undefined => undefined;
export function entryOf(line: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(line);
  if (typeof parsed !== 'object' || parsed === null) throw new Error('log line is not an object');
  return Object.fromEntries(Object.entries(parsed));
}
export const run = (host: SoakHost, perfOff = true) =>
  runScript(createSoakApp(ctx, host), steps(perfOff), { ctx, pulseFps: false });
