import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run, quit, isKeyMsg, type App, vstackV3 } from '@flyingrobots/bijou-tui';
import { badge, createSurface, stringToSurface } from '@flyingrobots/bijou';

initDefaultContext();

// Global CSS Stylesheet
const css = `
  Badge {
    color: var(semantic.primary);
  }

  .active {
    background: var(status.success);
    color: var(semantic.primary);
  }

  .warning {
    background: var(status.warning);
    color: #000000;
  }

  #header-badge {
    background: var(semantic.accent);
    color: var(semantic.primary);
  }

  @media (width < 50) {
    Badge {
      background: var(status.error); /* Responsive override! */
    }
  }
`;

interface Model {
  count: number;
}

const app: App<Model, any> = {
  init: () => [{ count: 0 }, []],
  update: (msg, model) => {
    if (isKeyMsg(msg) && (msg.key === 'q' || (msg.ctrl && msg.key === 'c'))) {
      return [model, [quit()]];
    }
    return [model, []];
  },
  view: (model) => {
    const normal = badge('Normal Badge');
    const active = badge('Active Class', { class: 'active' });
    const warning = badge('Warning Class', { class: 'warning' });
    const idBadge = badge('ID Badge', { id: 'header-badge' });
    
    const content = vstackV3(
      badge('BCSS ENGINE DEMO', { variant: 'primary' }),
      createSurface(1, 1),
      normal,
      createSurface(1, 1),
      active,
      createSurface(1, 1),
      warning,
      createSurface(1, 1),
      idBadge,
      createSurface(1, 1),
      stringToSurface('(Resize the terminal to see Media Queries in action!)', 60, 1),
      createSurface(1, 1),
      stringToSurface('Press Q to quit', 20, 1)
    );

    const full = createSurface(process.stdout.columns, process.stdout.rows);
    full.blit(content, 5, 2);
    return full;
  }
};

run(app, { css });
