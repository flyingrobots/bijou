import { describe, expect, it, vi } from 'vitest';
import { createSurface, type LayoutNode } from '@flyingrobots/bijou';
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

function createRoot(children: ReturnType<typeof createMotionNode>[]): LayoutNode {
  return {
    rect: { x: 0, y: 0, width: 40, height: 10 },
    children,
  };
}

function createStaticNode(id: string, x: number, y: number): LayoutNode {
  return {
    id,
    rect: { x, y, width: 4, height: 1 },
    children: [],
    surface: createSurface(4, 1),
  };
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

  it('warns when motion keys appear and disappear on the same frame', () => {
    const reconciler = new MotionReconciler();
    const writeError = vi.fn();

    reconciler.reconcile(createRoot([createMotionNode('row-0', 0, 0)]), 0, { writeError });
    reconciler.reconcile(createRoot([createMotionNode('row-1', 0, 1)]), 1 / 60, { writeError });

    expect(writeError).toHaveBeenCalledTimes(1);
    expect(writeError).toHaveBeenCalledWith(expect.stringContaining('row-1'));
    expect(writeError).toHaveBeenCalledWith(expect.stringContaining('row-0'));
    expect(writeError).toHaveBeenCalledWith(expect.stringContaining('unstable'));
  });

  it('does not warn when a motion key only appears without a paired disappearance', () => {
    const reconciler = new MotionReconciler();
    const writeError = vi.fn();

    reconciler.reconcile(createRoot([]), 0, { writeError });
    reconciler.reconcile(createRoot([createMotionNode('row-0', 0, 0)]), 1 / 60, { writeError });

    expect(writeError).not.toHaveBeenCalled();
  });

  it('ignores plain layout node ids that are not tagged with motion()', () => {
    const reconciler = new MotionReconciler();
    const writeError = vi.fn();

    reconciler.reconcile(createRoot([createStaticNode('row-0', 0, 0)]), 0, { writeError });
    reconciler.reconcile(createRoot([createStaticNode('row-1', 0, 1)]), 1 / 60, { writeError });

    expect(writeError).not.toHaveBeenCalled();
  });
});
