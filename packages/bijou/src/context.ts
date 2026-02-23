import type { BijouContext } from './ports/context.js';

let defaultContext: BijouContext | null = null;

export function getDefaultContext(): BijouContext {
  if (defaultContext === null) {
    throw new Error(
      '[bijou] No default context configured. ' +
      'Import @flyingrobots/bijou-node to auto-configure, ' +
      'or call setDefaultContext() explicitly.',
    );
  }
  return defaultContext;
}

export function setDefaultContext(ctx: BijouContext): void {
  defaultContext = ctx;
}

export function _resetDefaultContextForTesting(): void {
  defaultContext = null;
}
