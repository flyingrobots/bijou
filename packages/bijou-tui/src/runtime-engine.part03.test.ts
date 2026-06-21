import type { LayoutNode } from '@flyingrobots/bijou';
import { describe, expect, it } from 'vitest';
import { createRuntimeRetainedLayouts, createRuntimeViewStack, dropInactiveRuntimeLayouts, getRuntimeRetainedLayout, invalidateRuntimeLayouts, listRuntimeRetainedLayouts, popRuntimeView, pushRuntimeView, retainRuntimeLayout } from './runtime-engine.js';

describe('runtime retained layouts', () => {
  function layoutNode(id: string, width: number, height: number): LayoutNode {
    return {
      id,
      rect: {
        x: 0,
        y: 0,
        width,
        height,
      },
      children: [],
    };
  }
  it('retains layout trees by active view id and exposes them for lookup', () => {
    const layouts = retainRuntimeLayout(createRuntimeRetainedLayouts(), {
      viewId: 'workspace',
      tree: layoutNode('workspace-root', 80, 24),
    });
    expect(listRuntimeRetainedLayouts(layouts).map((layout) => layout.viewId)).toEqual(['workspace']);
    expect(getRuntimeRetainedLayout(layouts, 'workspace')).toMatchObject({
      viewId: 'workspace',
      version: 1,
      invalidated: false,
      causes: [],
    });
  });
  it('marks retained layouts invalidated with explicit deduped causes', () => {
    const retained = retainRuntimeLayout(createRuntimeRetainedLayouts(), {
      viewId: 'workspace',
      tree: layoutNode('workspace-root', 80, 24),
    });
    const invalidated = invalidateRuntimeLayouts(
      invalidateRuntimeLayouts(
        invalidateRuntimeLayouts(retained, 'terminal-resize'),
        'terminal-resize',
      ),
      'overflow-change',
      ['workspace'],
    );
    expect(getRuntimeRetainedLayout(invalidated, 'workspace')).toMatchObject({
      invalidated: true,
      causes: ['terminal-resize', 'overflow-change'],
    });
  });
  it('clears invalidation and increments version when a retained layout is replaced', () => {
    const retained = retainRuntimeLayout(createRuntimeRetainedLayouts(), {
      viewId: 'workspace',
      tree: layoutNode('workspace-root', 80, 24),
    });
    const invalidated = invalidateRuntimeLayouts(retained, 'content-change');
    const refreshed = retainRuntimeLayout(invalidated, {
      viewId: 'workspace',
      tree: layoutNode('workspace-root', 100, 30),
    });
    expect(getRuntimeRetainedLayout(refreshed, 'workspace')).toMatchObject({
      version: 2,
      invalidated: false,
      causes: [],
    });
    expect(getRuntimeRetainedLayout(refreshed, 'workspace')?.tree.rect).toMatchObject({
      width: 100,
      height: 30,
    });
  });
  it('drops retained layouts for views no longer present in the active view stack', () => {
    const stack = pushRuntimeView(createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      blocksBelow: false,
    }), {
      id: 'help',
      kind: 'help',
      dismissible: true,
      blocksBelow: true,
    });
    const layouts = retainRuntimeLayout(retainRuntimeLayout(createRuntimeRetainedLayouts(), {
      viewId: 'workspace',
      tree: layoutNode('workspace-root', 80, 24),
    }), {
      viewId: 'help',
      tree: layoutNode('help-root', 50, 10),
    });
    const nextStack = popRuntimeView(stack).stack;
    const dropped = dropInactiveRuntimeLayouts(layouts, nextStack);
    expect(listRuntimeRetainedLayouts(dropped).map((layout) => layout.viewId)).toEqual(['workspace']);
    expect(getRuntimeRetainedLayout(dropped, 'help')).toBeUndefined();
  });
  it('can invalidate all retained layouts after a view-stack change', () => {
    const layouts = retainRuntimeLayout(retainRuntimeLayout(createRuntimeRetainedLayouts(), {
      viewId: 'workspace',
      tree: layoutNode('workspace-root', 80, 24),
    }), {
      viewId: 'search',
      tree: layoutNode('search-root', 40, 12),
    });
    const invalidated = invalidateRuntimeLayouts(layouts, 'view-stack-change');
    expect(listRuntimeRetainedLayouts(invalidated).every((layout) => layout.invalidated)).toBe(true);
    expect(listRuntimeRetainedLayouts(invalidated).every((layout) => layout.causes.includes('view-stack-change'))).toBe(true);
  });
});
