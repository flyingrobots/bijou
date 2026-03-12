import { pathToFileURL } from 'node:url';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { badge, boxV3, type LayoutNode } from '@flyingrobots/bijou';
import { isKeyMsg, motion, quit, run, type App, vstackV3 } from '@flyingrobots/bijou-tui';
import { line } from '../_shared/v3.ts';

export const ctx = initDefaultContext();

interface Model {
  x: number;
  y: number;
}

export const app: App<Model> = {
  init: () => [{ x: 6, y: 6 }, []],

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) return [model, [quit()]];
      if (msg.key === 'right') return [{ ...model, x: Math.min(model.x + 6, ctx.runtime.columns - 32) }, []];
      if (msg.key === 'left') return [{ ...model, x: Math.max(2, model.x - 6) }, []];
      if (msg.key === 'down') return [{ ...model, y: Math.min(model.y + 3, ctx.runtime.rows - 10) }, []];
      if (msg.key === 'up') return [{ ...model, y: Math.max(4, model.y - 3) }, []];
    }
    return [model, []];
  },

  view: (model) => {
    const springCard = motion(
      { key: 'spring-card', transition: { type: 'spring', spring: 'wobbly' } },
      boxV3(
        vstackV3(
          badge('Spring', { variant: 'success' }),
          line('Follows the target with a spring preset.'),
        ),
        { title: 'Wobbly', padding: { top: 1, bottom: 1, left: 2, right: 2 } },
      ),
    );
    springCard.rect = { ...springCard.rect, x: model.x, y: model.y };

    const tweenCard = motion(
      { key: 'tween-card', transition: { type: 'tween', duration: 240 }, initial: { x: -18 } },
      boxV3(
        vstackV3(
          badge('Tween', { variant: 'accent' }),
          line('Moves on a fixed duration curve.'),
        ),
        { title: 'Timed', padding: { top: 1, bottom: 1, left: 2, right: 2 } },
      ),
    );
    tweenCard.rect = { ...tweenCard.rect, x: model.x + 22, y: model.y + 4 };

    const info: LayoutNode = {
      rect: { x: 3, y: 1, width: 70, height: 2 },
      children: [],
      surface: vstackV3(
        line('Arrow keys move both cards. The green card uses a spring; the amber card uses a tween.'),
        line('Press Q to quit.'),
      ),
    };

    return {
      rect: { x: 0, y: 0, width: ctx.runtime.columns, height: ctx.runtime.rows },
      children: [info, springCard, tweenCard],
    };
  },
};

if (process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run(app);
}
