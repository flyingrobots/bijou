import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run, quit, isKeyMsg, type App, motion } from '@flyingrobots/bijou-tui';
import { badge, createSurface, stringToSurface, type LayoutNode } from '@flyingrobots/bijou';

initDefaultContext();

interface Model {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

const app: App<Model, any> = {
  init: () => [{ x: 5, y: 5, targetX: 5, targetY: 5 }, []],
  
  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) return [model, [quit()]];
      
      // Move target instantly on keypress
      if (msg.key === 'right') return [{ ...model, targetX: model.targetX + 10 }, []];
      if (msg.key === 'left')  return [{ ...model, targetX: model.targetX - 10 }, []];
      if (msg.key === 'down')  return [{ ...model, targetY: model.targetY + 5 }, []];
      if (msg.key === 'up')    return [{ ...model, targetY: model.targetY - 5 }, []];
    }
    return [model, []];
  },

  view: (model) => {
    // The target layout state: where the badge WANTS to be.
    // The Motion API will interpolate the 'moving-badge' node automatically.
    
    const movingBadge: LayoutNode = motion(
      { key: 'moving-badge' },
      badge('SMOOTH MOTION')
    );
    
    // Position the badge at target coordinates in the layout tree
    movingBadge.rect.x = model.targetX;
    movingBadge.rect.y = model.targetY;

    // Return a layout tree
    return {
      rect: { x: 0, y: 0, width: process.stdout.columns, height: process.stdout.rows },
      children: [
        movingBadge,
        {
          rect: { x: 5, y: 2, width: 60, height: 1 },
          children: [],
          surface: stringToSurface('Use ARROW KEYS to move the badge. Notice the smooth spring physics!', 60, 1)
        },
        {
          rect: { x: 5, y: 20, width: 20, height: 1 },
          children: [],
          surface: stringToSurface('Press Q to quit', 20, 1)
        }
      ]
    };
  }
};

run(app);
