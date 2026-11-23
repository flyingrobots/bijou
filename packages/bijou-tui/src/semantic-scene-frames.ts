import type { EventBusDisposable } from './eventbus-contract.js';
import type { SemanticSceneFrame } from './semantic-scene-contract.js';

export interface SemanticSceneFrameQueue<Model> {
  /** Deliver `frame` to every listener after the frames committed before it. */
  publish(frame: SemanticSceneFrame<Model>): void;
  subscribe(
    listener: (frame: SemanticSceneFrame<Model>) => void,
  ): EventBusDisposable;
  clear(): void;
}

/**
 * Deliver committed frames to listeners one frame at a time. A listener that
 * causes a new frame while it handles one only queues it, so every listener
 * sees each frame once, in commit order. When a listener throws, the queue
 * drops its pending frames and the error goes to the caller.
 */
export function createFrameQueue<Model>(): SemanticSceneFrameQueue<Model> {
  const listeners = new Set<(frame: SemanticSceneFrame<Model>) => void>();
  const pending: SemanticSceneFrame<Model>[] = [];
  let delivering = false;
  return {
    publish(frame) {
      pending.push(frame);
      if (delivering) return;
      delivering = true;
      try {
        let next = pending.shift();
        while (next !== undefined) {
          for (const listener of listeners) listener(next);
          next = pending.shift();
        }
      } finally {
        delivering = false;
        pending.length = 0;
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return {
        dispose() {
          listeners.delete(listener);
        },
      };
    },
    clear() {
      listeners.clear();
      pending.length = 0;
    },
  };
}
