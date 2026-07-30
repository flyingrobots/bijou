import type {
  ClockPort,
  Surface,
} from '@flyingrobots/bijou';
import type { EventBus } from './eventbus.js';
import type {
  App,
} from './types.js';
import type { BusMsg } from './eventbus.js';
import type {
  TestRuntimeCommandRecord,
  TestRuntimeCommandResolution,
  TestRuntimeOptions,
  TestRuntimeSnapshot,
} from './driver-harness-contract.js';

export type {
  TestHarness,
  TestRuntimeCommandRecord,
  TestRuntimeCommandResolution,
  TestRuntimeOptions,
  TestRuntimeSnapshot,
} from './driver-harness-contract.js';
export type {
  MouseMoveStepOptions,
  MouseScriptStep,
  MouseScriptStepOptions,
  MouseWheelDirection,
  RunScriptOptions,
  RunScriptResult,
  ScriptStep,
} from './driver-script-contract.js';

export interface DriverRuntimeState {
  running: boolean;
  tornDown: boolean;
}

export interface HarnessState<Model, M> {
  readonly app: App<Model, M>;
  readonly options: TestRuntimeOptions | undefined;
  readonly bus: EventBus<M>;
  readonly clock: ClockPort;
  readonly start: number;
  readonly runtime: DriverRuntimeState;
  readonly frames: Surface[];
  readonly snapshots: TestRuntimeSnapshot<Model, M>[];
  readonly messages: BusMsg<M>[];
  readonly emittedMessages: M[];
  readonly commands: MutableCommandRecord<M>[];
  model: Model;
  currentSize: { width: number; height: number };
  nextCommandId: number;
}

export interface MutableCommandRecord<M>
  extends TestRuntimeCommandRecord<M> {
  emitted: M[];
  resolution: TestRuntimeCommandResolution;
  result?: unknown;
  cleanedUp: boolean;
  settled: boolean;
}
