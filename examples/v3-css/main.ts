import { pathToFileURL } from 'node:url';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { badge, boxSurface } from '@flyingrobots/bijou';
import { hstackSurface, isKeyMsg, quit, run, type App, vstackSurface } from '@flyingrobots/bijou-tui';
import { centerSurface, line, spacer } from '../_shared/v3.ts';

export const ctx = initDefaultContext();

export const css = `
  Badge {
    color: var(semantic.primary);
  }

  Box {
    background: var(surface.overlay);
    color: var(border.primary);
  }

  .active {
    background: var(status.success);
    color: #04110a;
  }

  .warning {
    background: var(status.warning);
    color: #1c1300;
  }

  #hero-box {
    background: var(surface.elevated);
    color: var(semantic.accent);
  }

  @media (width < 80) {
    Box {
      background: var(status.error);
      color: #fff5f5;
    }
  }
`;

export const app: App<null> = {
  init: () => [null, []],
  update: (msg, model) => {
    if (isKeyMsg(msg) && (msg.key === 'q' || (msg.ctrl && msg.key === 'c'))) {
      return [model, [quit()]];
    }
    return [model, []];
  },
  view: () => {
    const chips = hstackSurface(
      2,
      badge('Type selector'),
      badge('Class selector', { class: 'active' }),
      badge('Warning', { class: 'warning' }),
    );

    const hero = boxSurface(
      vstackSurface(
        line('BCSS resolves type, class, id, var(), and media queries in the runtime path.'),
        spacer(1, 1),
        chips,
        spacer(1, 1),
        line(`Resize below 80 columns to flip the container theme. Current width: ${ctx.runtime.columns}`),
        line('Press Q to quit.'),
      ),
      {
        id: 'hero-box',
        padding: { top: 1, bottom: 1, left: 2, right: 2 },
        title: 'BCSS Workbench',
      },
    );

    return centerSurface(ctx, hero);
  },
};

if (process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run(app, { ctx, css });
}
