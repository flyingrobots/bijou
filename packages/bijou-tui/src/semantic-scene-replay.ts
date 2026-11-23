import type {
  SemanticSceneCheckpoint,
  SemanticSceneController,
  UiActionRequest,
} from './semantic-scene-contract.js';

/**
 * Invoke each request in order and record the result, model and scene after
 * each one. The replay is synchronous: a message that a command returns
 * later is not part of a checkpoint.
 */
export function replaySemanticSceneActions<Model, M>(
  controller: SemanticSceneController<Model, M>,
  requests: readonly UiActionRequest[],
): readonly SemanticSceneCheckpoint<Model, M>[] {
  return requests.map((request) => {
    const result = controller.invoke(request);
    const { model, scene } = controller.frame();
    return { request, result, model, scene };
  });
}
