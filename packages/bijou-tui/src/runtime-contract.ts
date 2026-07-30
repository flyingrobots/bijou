import type {
  BijouContext,
  ClockPort,
  TimerHandle,
} from '@flyingrobots/bijou';
import type { EventBus } from './eventbus.js';
import type { RenderStageTiming } from './pipeline/pipeline.js';
import type {
  App,
  RunOptions,
} from './types.js';

export interface RuntimeRenderSummary<Model> {
  readonly model: Model;
  readonly dt: number;
  readonly timings: readonly RenderStageTiming[];
  readonly viewport: {
    readonly columns: number;
    readonly rows: number;
  };
}

export interface RuntimePostRenderEffect<Model> {
  readonly model?: Model;
  readonly requestRender?: boolean;
}

export interface RuntimeLifecycleHooks<Model> {
  beforeRender?(model: Model): Model | undefined;
  afterRender?(
    summary: RuntimeRenderSummary<Model>,
  ): RuntimePostRenderEffect<Model> | undefined;
}

export interface RuntimeSession<Model> {
  model: Model;
  running: boolean;
  lastCtrlC: number | null;
  currentDt: number;
  fatalError: unknown;
  crashMode: boolean;
  resolveQuit: (() => void) | null;
  renderQueued: boolean;
  renderInFlight: boolean;
  renderHandle: TimerHandle | null;
}

export interface RuntimeRenderer {
  render(): void;
  hasPendingRender(): boolean;
  dispose(): void;
}

export interface InteractiveRuntimeInput<Model, M> {
  readonly app: App<Model, M>;
  readonly options: RunOptions<M> | undefined;
  readonly hooks: RuntimeLifecycleHooks<Model> | undefined;
  readonly ctx: BijouContext;
  readonly clock: ClockPort;
  readonly bus: EventBus<M>;
  readonly session: RuntimeSession<Model>;
  readonly runtimeViewport: () => { columns: number; rows: number };
  readonly routeRuntimeIssue: (
    issue: import('./types.js').RuntimeIssue,
  ) => void;
  readonly crash: (
    phase: 'update' | 'render' | 'resize',
    error: unknown,
    snapshot: Model,
  ) => void;
}
