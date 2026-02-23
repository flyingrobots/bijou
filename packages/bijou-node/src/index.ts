import type { BijouContext } from '@flyingrobots/bijou';
import { createBijou, setDefaultContext } from '@flyingrobots/bijou';
import { nodeRuntime } from './runtime.js';
import { nodeIO } from './io.js';
import { chalkStyle } from './style.js';

export { nodeRuntime } from './runtime.js';
export { nodeIO } from './io.js';
export { chalkStyle } from './style.js';

export function createNodeContext(): BijouContext {
  const runtime = nodeRuntime();
  const noColor = runtime.env('NO_COLOR') !== undefined;
  return createBijou({
    runtime,
    io: nodeIO(),
    style: chalkStyle(noColor),
  });
}

let initialized = false;
export function initDefaultContext(): BijouContext {
  if (!initialized) {
    const ctx = createNodeContext();
    setDefaultContext(ctx);
    initialized = true;
    return ctx;
  }
  return createNodeContext();
}
