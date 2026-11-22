import type { BijouContext, UiSceneIr } from '@flyingrobots/bijou';
import type { EventBus, EventBusDisposable } from './eventbus-contract.js';
import type { App } from './types.js';

/** The input payload that a host may attach to an action. */
export type UiActionValue = string | number | boolean;

/** What a host sends: an action id it read from the scene, and an input. */
export interface UiActionRequest {
  readonly actionId: string;
  readonly value?: UiActionValue | undefined;
}

/**
 * What the app receives. `command` and `targetNodeId` come from the action
 * that the latest scene declares, never from the host.
 */
export interface UiActionInvocation {
  readonly actionId: string;
  readonly command: string;
  readonly targetNodeId?: string | undefined;
  readonly value?: UiActionValue | undefined;
}

/** Projects a model to `ui-scene-ir/1` and maps an action to a message. */
export interface SceneProjection<Model, M> {
  /** Return the `ui-scene-ir/1` scene for the model. */
  viewScene(model: Model, ctx: BijouContext): UiSceneIr;
  /** Return the message for the action, or `undefined` when none applies. */
  dispatchAction(action: UiActionInvocation, model: Model): M | undefined;
}

/** A TEA app that also has a semantic scene projection. */
export type SemanticSceneApp<Model, M = never> =
  App<Model, M> & SceneProjection<Model, M>;

export type SemanticSceneDiagnosticCode =
  | 'action-not-declared'
  | 'action-unhandled'
  | 'controller-crashed'
  | 'controller-stopped';

/** Why the controller ignored an action request. */
export interface SemanticSceneDiagnostic {
  readonly code: SemanticSceneDiagnosticCode;
  readonly actionId: string;
  readonly sceneId: string;
  readonly message: string;
}

export type SemanticSceneCrashPhase = 'dispatch' | 'update' | 'view';

/** The failure that stopped the controller, and the model it kept. */
export interface SemanticSceneCrash<Model> {
  readonly phase: SemanticSceneCrashPhase;
  readonly error: unknown;
  readonly model: Model;
}

export type SemanticSceneInvocationResult<Model, M> =
  | {
      readonly status: 'dispatched';
      readonly invocation: UiActionInvocation;
      readonly message: M;
    }
  | {
      readonly status: 'ignored';
      readonly diagnostic: SemanticSceneDiagnostic;
    }
  | {
      readonly status: 'crashed';
      readonly crash: SemanticSceneCrash<Model>;
    };

/** One model and the validated scene projected from it. */
export interface SemanticSceneFrame<Model> {
  readonly model: Model;
  readonly scene: UiSceneIr;
}

export type SemanticSceneStatus = 'running' | 'crashed' | 'stopped';

export interface SemanticSceneControllerOptions<Model, M> {
  /** The context that `viewScene()` receives. Its clock drives commands. */
  readonly ctx: BijouContext;
  /** The host's bus. Without it the controller creates and owns one. */
  readonly bus?: EventBus<M> | undefined;
  readonly onDiagnostic?:
    | ((diagnostic: SemanticSceneDiagnostic) => void)
    | undefined;
  readonly onCrash?: ((crash: SemanticSceneCrash<Model>) => void) | undefined;
}

export interface SemanticSceneController<Model, M> {
  /** The one bus that carries every message into `app.update()`. */
  readonly bus: EventBus<M>;
  readonly status: SemanticSceneStatus;
  /** The current model and its scene. */
  frame(): SemanticSceneFrame<Model>;
  /** The failure that stopped the controller, if any. */
  crash(): SemanticSceneCrash<Model> | undefined;
  /** Dispatch an action that the current scene declares. */
  invoke(request: UiActionRequest): SemanticSceneInvocationResult<Model, M>;
  /** Call `listener` after each new frame. */
  subscribe(
    listener: (frame: SemanticSceneFrame<Model>) => void,
  ): EventBusDisposable;
  /** Stop handling messages. A second call does nothing. */
  stop(): void;
}

/** The state after one replayed action request. */
export interface SemanticSceneCheckpoint<Model, M> {
  readonly request: UiActionRequest;
  readonly result: SemanticSceneInvocationResult<Model, M>;
  readonly model: Model;
  readonly scene: UiSceneIr;
}
