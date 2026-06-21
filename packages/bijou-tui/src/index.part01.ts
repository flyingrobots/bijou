/**
 * bijou-tui — TEA-based terminal UI framework.
 *
 * Re-export all public types, functions, and constants from the bijou-tui
 * package. Import from `@flyingrobots/bijou-tui` for the full API.
 *
 * @module
 */

// Common core types paired with TUI authoring surfaces
export type { BijouContext, Cell, Surface } from '@flyingrobots/bijou';

// Types
export type {
  App,
  Cmd,
  KeyMsg,
  ResizeMsg,
  MouseMsg,
  MouseButton,
  MouseAction,
  QuitSignal,
  RunOptions,
  RuntimeIssue,
  RuntimeIssueLevel,
  RuntimeIssueSource,
} from './types.js';

export { QUIT, isKeyMsg, isResizeMsg, isMouseMsg } from './types.js';

// Runtime engine
export type {
  ApplyRuntimeCommandBufferResult,
  ExecuteRuntimeEffectBufferResult,
  CreateRuntimeComponentContractOptions,
  CreateRuntimeComponentNodeOptions,
  RuntimeBuffers,
  RuntimeComponentAlignment,
  RuntimeComponentBlockOverflowPolicy,
  RuntimeComponentContract,
  RuntimeComponentInputContext,
  RuntimeComponentInlineOverflowPolicy,
  RuntimeComponentInteractionContract,
  RuntimeComponentKeyBindings,
  RuntimeComponentLayoutNode,
  RuntimeComponentLayoutRules,
  RuntimeComponentOverflowRules,
  RuntimeComponentPointerBindings,
  RuntimeComponentSizeMode,
  RuntimeCommandBuffer,
  RuntimeEffectBuffer,
  RetainRuntimeLayoutOptions,
  RuntimeInputEvent,
  RuntimeInputHandler,
  RuntimeInputRouteContext,
  RuntimeInputRouteOutcome,
  RuntimeInputRouteResult,
  RuntimeKeyInputEvent,
  RuntimeLayoutHit,
  RuntimeLayoutInvalidationCause,
  RuntimePointerAction,
  RuntimePointerButton,
  RuntimePointerInputEvent,
  RuntimeStateLike,
  RuntimeStateMachine,
  RuntimeRetainedLayout,
  RuntimeRetainedLayouts,
  RuntimeViewLayer,
  RuntimeStackLayer,
  RuntimeViewStack,
  PopRuntimeViewResult,
} from './runtime-engine.js';

export {
  RUNTIME_COMPONENT_ALIGNMENTS,
  RUNTIME_COMPONENT_BLOCK_OVERFLOW_POLICIES,
  RUNTIME_COMPONENT_INLINE_OVERFLOW_POLICIES,
  RUNTIME_COMPONENT_SIZE_MODES,
  RUNTIME_LAYOUT_INVALIDATION_CAUSES,
  RUNTIME_POINTER_ACTIONS,
  RUNTIME_POINTER_BUTTONS,
  activeRuntimeView,
  appendRuntimeCommands,
  appendRuntimeEffects,
  applyRuntimeCommandBuffer,
  bufferRuntimeRouteResult,
  clearRuntimeViewsToRoot,
  createRuntimeComponentContract,
  createRuntimeComponentNode,
  createRuntimeBuffers,
  createRuntimeCommandBuffer,
  createRuntimeEffectBuffer,
  createRuntimeStateMachine,
  createRuntimeRetainedLayouts,
  createRuntimeViewStack,
  dropInactiveRuntimeLayouts,
  executeRuntimeEffectBuffer,
  getRuntimeRetainedLayout,
  getRuntimeComponentContract,
  handleRuntimeComponentInput,
  hitTestRuntimeLayout,
  invalidateRuntimeLayouts,
  listRuntimeRetainedLayouts,
  popRuntimeView,
  pushRuntimeView,
  resolveRuntimeInteractiveTarget,
  routeRuntimeInput,
  retainRuntimeLayout,
  replaceRuntimeRootView,
  replaceTopRuntimeView,
  runtimeComponentAcceptsInput,
  transitionRuntimeState,
} from './runtime-engine.js';

export type {
  DispatchRuntimeCommandIntentInput,
  DispatchRuntimeCommandIntentResult,
  RuntimeBindingLayerModel,
  RuntimeCommandIntentEmission,
  RuntimeCommandIntentEmissionOptions,
  RuntimeCommandIntentRoute,
  RuntimeCommandIntentRouteInput,
  RuntimeViewBindingSource,
  RuntimeViewBindingSourceInput,
} from './runtime-binding.js';
