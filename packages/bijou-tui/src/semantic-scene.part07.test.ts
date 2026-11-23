import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { describe, expect, it } from 'vitest';
import { createEventBus } from './eventbus.js';
import { createSemanticSceneController } from './semantic-scene.js';
import {
  createPanelApp,
  INCREMENT,
  type PanelMsg,
} from './semantic-scene.test-support.js';

describe('semantic scene controller: re-entrant listeners', () => {
  it('gives every listener each frame once, in commit order', () => {
    const controller = createSemanticSceneController(createPanelApp(), {
      ctx: createTestContext(),
    });
    const first: number[] = [];
    const second: number[] = [];
    controller.subscribe((frame) => {
      first.push(frame.model.count);
      if (frame.model.count === 1) controller.invoke(INCREMENT);
    });
    controller.subscribe((frame) => {
      second.push(frame.model.count);
    });

    controller.invoke(INCREMENT);

    expect(first).toEqual([1, 2]);
    expect(second).toEqual([1, 2]);
    expect(controller.frame().model.count).toBe(2);
    controller.stop();
  });

  it('delivers later frames after a listener throws', () => {
    const errors: string[] = [];
    const bus = createEventBus<PanelMsg>({
      onError(message) {
        errors.push(message);
      },
    });
    const controller = createSemanticSceneController(createPanelApp(), {
      ctx: createTestContext(),
      bus,
    });
    const seen: number[] = [];
    controller.subscribe((frame) => {
      seen.push(frame.model.count);
      if (frame.model.count === 1) throw new Error('listener failed');
    });

    controller.invoke(INCREMENT);
    controller.invoke(INCREMENT);

    expect(seen).toEqual([1, 2]);
    expect(errors).toEqual(['[EventBus] Subscriber threw:']);
    controller.stop();
    bus.dispose();
  });
});
