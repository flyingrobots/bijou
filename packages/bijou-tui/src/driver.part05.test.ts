import { describe, it, expect } from 'vitest';
import { runScript, testRuntime } from './driver.js';
import type { App } from './types.js';
import { isKeyMsg } from './types.js';
import { createSurface, stringToSurface, surfaceToString, type Surface } from '@flyingrobots/bijou';
import { plainStyle } from '@flyingrobots/bijou/adapters/test';

const style = plainStyle();
const text = (frame: Surface): string => surfaceToString(frame, style).trimEnd();

interface StepModel {
  step: number;
}

/**
 * An app whose view repaints one reused screen surface, the way a framed app
 * repaints its composed scratch surface, instead of returning a new surface.
 */
function reusedScreenApp(): App<StepModel> {
  const screen = createSurface(8, 1);
  return {
    init: () => [{ step: 0 }, []],
    update(msg, model) {
      if (isKeyMsg(msg) && msg.key === 'right') return [{ step: model.step + 1 }, []];
      return [model, []];
    },
    view(model) {
      screen.blit(stringToSurface(`Step ${String(model.step)}`, 8, 1), 0, 0);
      return screen;
    },
  };
}

const right = { key: '\x1b[C' };

describe('runScript recorded frames (flyingrobots/bijou#822)', () => {
  it('records each frame as it was on screen when the view reuses one surface', async () => {
    const result = await runScript(reusedScreenApp(), [right, right], { pulseFps: false });
    expect(result.frames).toHaveLength(3);
    expect(new Set(result.frames).size).toBe(3);
    expect(result.frames.map((frame) => text(frame))).toEqual([
      'Step 0',
      'Step 1',
      'Step 2',
    ]);
  });

  it('hands onFrame the same snapshot that the result records', async () => {
    const handed: Surface[] = [];
    const seen: string[] = [];
    const result = await runScript(reusedScreenApp(), [right], {
      pulseFps: false,
      onFrame: (frame) => {
        handed.push(frame);
        seen.push(text(frame));
      },
    });
    expect(seen).toEqual(['Step 0', 'Step 1']);
    expect(handed).toHaveLength(result.frames.length);
    handed.forEach((frame, index) => {
      expect(frame).toBe(result.frames[index]);
    });
    expect(result.frames.map((frame) => text(frame))).toEqual(seen);
  });
});

describe('testRuntime snapshots (flyingrobots/bijou#822)', () => {
  it('keeps each snapshot frame as it was on screen when the view reuses one surface', async () => {
    const harness = await testRuntime(reusedScreenApp(), { pulseFps: false });
    await harness.step(right);
    await harness.step(right);
    const texts = harness.snapshots.map((snapshot) => text(snapshot.frame));
    expect(texts).toEqual(['Step 0', 'Step 1', 'Step 2']);
    expect(harness.frames.map((frame) => text(frame))).toEqual(texts);
    await harness.teardown();
  });
});
