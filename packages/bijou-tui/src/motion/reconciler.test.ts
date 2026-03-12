import { describe, expect, it } from 'vitest';
import { createSurface } from '@flyingrobots/bijou';
import { motion } from './motion.js';
import { MotionReconciler } from './reconciler.js';

function createMotionNode(
  key: string,
  x: number,
  y: number,
  options?: Parameters<typeof motion>[0],
) {
  const node = motion(
    options ?? { key },
    createSurface(4, 1),
  );
  node.rect = { x, y, width: 4, height: 1 };
  return node;
}

describe('MotionReconciler', () => {
  it('interpolates keyed spring motion between frames', () => {
    const reconciler = new MotionReconciler();

    const start = createMotionNode('spring-box', 0, 0);
    reconciler.reconcile(start, 0);
    expect(start.rect.x).toBe(0);

    const moved = createMotionNode('spring-box', 12, 0, {
      key: 'spring-box',
      transition: { type: 'spring', spring: 'stiff' },
    });
    reconciler.reconcile(moved, 1 / 60);

    expect(moved.rect.x).toBeGreaterThan(0);
    expect(moved.rect.x).toBeLessThan(12);
  });

  it('supports tween motion with a fixed duration', () => {
    const reconciler = new MotionReconciler();

    reconciler.reconcile(createMotionNode('tween-box', 0, 0), 0);

    const halfway = createMotionNode('tween-box', 10, 0, {
      key: 'tween-box',
      transition: { type: 'tween', duration: 100 },
    });
    reconciler.reconcile(halfway, 0.05);
    expect(halfway.rect.x).toBeGreaterThan(0);
    expect(halfway.rect.x).toBeLessThan(10);

    const complete = createMotionNode('tween-box', 10, 0, {
      key: 'tween-box',
      transition: { type: 'tween', duration: 100 },
    });
    reconciler.reconcile(complete, 0.05);
    expect(complete.rect.x).toBe(10);
  });

  it('honors initial position offsets on first appearance', () => {
    const reconciler = new MotionReconciler();

    const node = createMotionNode('initial-box', 8, 4, {
      key: 'initial-box',
      initial: { x: -5, y: 2 },
    });

    reconciler.reconcile(node, 0);

    expect(node.rect.x).toBe(3);
    expect(node.rect.y).toBe(6);
  });
});
