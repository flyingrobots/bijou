/** Stable scripted-driver facade over focused interaction modules. */

export {
  mouseMove,
  mousePress,
  mouseRelease,
  mouseWheel,
  sgrMouse,
} from './driver-mouse.js';
export { testRuntime } from './driver-harness.js';
export { runScript } from './driver-script.js';
export type {
  MouseMoveStepOptions,
  MouseScriptStep,
  MouseScriptStepOptions,
  MouseWheelDirection,
  RunScriptOptions,
  RunScriptResult,
  ScriptStep,
  TestHarness,
  TestRuntimeCommandRecord,
  TestRuntimeCommandResolution,
  TestRuntimeOptions,
  TestRuntimeSnapshot,
} from './driver-contract.js';
