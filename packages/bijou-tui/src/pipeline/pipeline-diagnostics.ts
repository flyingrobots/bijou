import type { RenderState } from './pipeline.js';

interface ThenableCandidate {
  then: unknown;
}

function isThenableCandidate(value: unknown): value is ThenableCandidate {
  return (typeof value === 'object' || typeof value === 'function')
    && value !== null
    && 'then' in value;
}

export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return isThenableCandidate(value) && typeof value.then === 'function';
}

export function formatUnknownDetail(value: unknown): string {
  if (value instanceof Error) return value.stack ?? value.message;
  if (value == null || typeof value !== 'object') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

export function writePipelineError(state: RenderState, message: string, detail?: unknown): void {
  const suffix = detail == null
    ? ''
    : detail instanceof Error
      ? ` ${detail.stack ?? detail.message}`
      : ` ${formatUnknownDetail(detail)}`;
  state.ctx.io.writeError(`${message}${suffix}\n`);
}

