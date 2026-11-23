import {
  validateUiSceneIr,
  type BijouContext,
  type UiAction,
  type UiSceneIr,
} from '@flyingrobots/bijou';
import type {
  SceneProjection,
  UiActionInvocation,
  UiActionRequest,
} from './semantic-scene-contract.js';

/** Project the model and throw when the scene fails `validateUiSceneIr()`. */
export function projectValidScene<Model, M>(
  app: SceneProjection<Model, M>,
  model: Model,
  ctx: BijouContext,
): UiSceneIr {
  const scene = app.viewScene(model, ctx);
  const result = validateUiSceneIr(scene);
  if (result.ok) return scene;
  const issues = result.issues
    .map((issue) => `${issue.code}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid ui-scene-ir/1 scene ${scene.id}: ${issues}`);
}

/** Join a host request with the action that the scene declares. */
export function toActionInvocation(
  action: UiAction,
  request: UiActionRequest,
): UiActionInvocation {
  return {
    actionId: action.id,
    command: action.command,
    ...(action.targetNodeId === undefined
      ? {}
      : { targetNodeId: action.targetNodeId }),
    ...(request.value === undefined ? {} : { value: request.value }),
  };
}
