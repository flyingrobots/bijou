/** Stable interactive runtime facade over focused lifecycle modules. */

export {
  run,
  runWithLifecycleHooks,
} from './runtime-loop.js';
export type {
  RuntimeLifecycleHooks,
  RuntimePostRenderEffect,
  RuntimeRenderSummary,
} from './runtime-contract.js';
