import { resolveClock } from '@flyingrobots/bijou';
import { createEventBus } from './eventbus-create.js';
import { createFrameQueue } from './semantic-scene-frames.js';
import type {
  SemanticSceneApp,
  SemanticSceneController,
  SemanticSceneControllerOptions,
  SemanticSceneCrash,
  SemanticSceneCrashPhase,
  SemanticSceneDiagnosticCode,
  SemanticSceneFrame,
  SemanticSceneInvocationResult,
  SemanticSceneStatus,
} from './semantic-scene-contract.js';
import {
  projectValidScene,
  toActionInvocation,
} from './semantic-scene-projection.js';
import type { Cmd } from './types.js';

/**
 * Run a semantic scene app without a terminal or a DOM.
 *
 * The controller holds the model and the scene projected from it. It accepts
 * an action only when the current scene declares its id, and sends the
 * message through the event bus, so `app.update()` and its commands run the
 * same way for every host. It throws when the initial scene is not valid.
 */
export function createSemanticSceneController<Model, M>(
  app: SemanticSceneApp<Model, M>,
  options: SemanticSceneControllerOptions<Model, M>,
): SemanticSceneController<Model, M> {
  const { ctx } = options;
  const [initialModel, initialCommands] = app.init();
  let current: SemanticSceneFrame<Model> = {
    model: initialModel,
    scene: projectValidScene(app, initialModel, ctx),
  };
  let status: SemanticSceneStatus = 'running';
  let crashed: SemanticSceneCrash<Model> | undefined;
  const frames = createFrameQueue<Model>();
  const bus = options.bus ?? createEventBus<M>({ clock: resolveClock(ctx) });

  const fail = (
    phase: SemanticSceneCrashPhase,
    error: unknown,
  ): SemanticSceneCrash<Model> => {
    const crash = { phase, error, model: current.model };
    crashed = crash;
    status = 'crashed';
    options.onCrash?.(crash);
    return crash;
  };
  const ignore = (
    code: SemanticSceneDiagnosticCode,
    actionId: string,
    message: string,
  ): SemanticSceneInvocationResult<Model, M> => {
    const diagnostic = { code, actionId, sceneId: current.scene.id, message };
    options.onDiagnostic?.(diagnostic);
    return { status: 'ignored', diagnostic };
  };
  const execute = (commands: readonly Cmd<M>[]): void => {
    for (const command of commands) bus.runCmd(command);
  };
  const stop = (): void => {
    if (status === 'stopped') return;
    status = 'stopped';
    updates.dispose();
    quits.dispose();
    frames.clear();
    if (options.bus === undefined) bus.dispose();
  };

  const updates = bus.on((message) => {
    if (status !== 'running') return;
    let next: [Model, Cmd<M>[]];
    try {
      next = app.update(message, current.model);
    } catch (error: unknown) {
      fail('update', error);
      return;
    }
    const [model, commands] = next;
    if (model === current.model) {
      execute(commands);
      return;
    }
    try {
      current = { model, scene: projectValidScene(app, model, ctx) };
    } catch (error: unknown) {
      fail('view', error);
      return;
    }
    try {
      frames.publish(current);
    } finally {
      execute(commands);
    }
  });
  const quits = bus.onQuit(stop);
  execute(initialCommands);

  return {
    bus,
    get status() {
      return status;
    },
    frame: () => current,
    crash: () => crashed,
    invoke(request) {
      const id = request.actionId;
      if (status === 'stopped') {
        return ignore('controller-stopped', id, `Action ${id} arrived after the controller stopped.`);
      }
      if (status === 'crashed') {
        return ignore('controller-crashed', id, `Action ${id} arrived after the controller crashed.`);
      }
      const { model, scene } = current;
      const action = scene.actions.find((declared) => declared.id === id);
      if (action === undefined) {
        return ignore('action-not-declared', id, `Action ${id} is not declared by scene ${scene.id}.`);
      }
      const invocation = toActionInvocation(action, request);
      let message: M | undefined;
      try {
        message = app.dispatchAction(invocation, model);
      } catch (error: unknown) {
        return { status: 'crashed', crash: fail('dispatch', error) };
      }
      if (message === undefined) {
        return ignore('action-unhandled', id, `Action ${id} (command ${action.command}) produced no message.`);
      }
      bus.emit(message);
      if (crashed !== undefined) return { status: 'crashed', crash: crashed };
      return { status: 'dispatched', invocation, message };
    },
    subscribe: (listener) => frames.subscribe(listener),
    stop,
  };
}
