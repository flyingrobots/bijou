import { pathToFileURL } from 'node:url';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { badge, boxSurface, separatorSurface } from '@flyingrobots/bijou';
import { hstackSurface, isKeyMsg, quit, run, type App, vstackSurface } from '@flyingrobots/bijou-tui';
import { centerSurface, line, spacer } from '../_shared/v3.ts';

export const ctx = initDefaultContext();

interface Model {
  count: number;
}

type Msg = never;

export const app: App<Model, Msg> = {
  init: () => [{ count: 0 }, []],

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) return [model, [quit()]];
      if (msg.key === ' ') return [{ ...model, count: model.count + 1 }, []];
    }
    return [model, []];
  },

  view: (model) => {
    const hero = badge('BIJOU V3', { variant: 'primary' });
    const metrics = hstackSurface(
      2,
      badge(`Count ${model.count}`, { variant: 'accent' }),
      badge(`${ctx.runtime.columns}x${ctx.runtime.rows}`, { variant: 'info' }),
      badge(ctx.mode, { variant: 'success' }),
    );
    const metricsDivider = separatorSurface({
      label: 'Live Metrics',
      width: Math.max(metrics.width, 22),
      ctx,
    });

    const body = vstackSurface(
      hero,
      spacer(1, 1),
      boxSurface(
        vstackSurface(
          line('Surface-first runtime, buffered rendering, and explicit string boundaries.'),
          spacer(1, 1),
          metricsDivider,
          spacer(1, 1),
          metrics,
          spacer(1, 1),
          line('Press SPACE to increment. Press Q to quit.'),
        ),
        { title: 'Starter App', padding: { top: 1, bottom: 1, left: 2, right: 2 } },
      ),
    );

    return centerSurface(ctx, body);
  },
};

if (process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run(app);
}
