import type { LayoutNode } from '@flyingrobots/bijou';
import { describe, expect, it } from 'vitest';
import {
  activeRuntimeView,
  clearRuntimeViewsToRoot,
  createRuntimeStateMachine,
  createRuntimeRetainedLayouts,
  createRuntimeViewStack,
  dropInactiveRuntimeLayouts,
  getRuntimeRetainedLayout,
  invalidateRuntimeLayouts,
  listRuntimeRetainedLayouts,
  popRuntimeView,
  pushRuntimeView,
  routeRuntimeInput,
  retainRuntimeLayout,
  replaceRuntimeRootView,
  replaceTopRuntimeView,
  transitionRuntimeState,
} from './runtime-engine.js';

describe('runtime state machine', () => {
  it('tracks current and previous state across explicit transitions', () => {
    const machine = createRuntimeStateMachine({
      id: 'session.active',
      sessionId: 'abc',
    });

    const next = transitionRuntimeState(machine, {
      id: 'session.ended',
      sessionId: 'abc',
    });

    expect(machine.current.id).toBe('session.active');
    expect(machine.previous).toBeUndefined();
    expect(next.current.id).toBe('session.ended');
    expect(next.previous?.id).toBe('session.active');
    expect(next.transitionCount).toBe(1);
  });
});

describe('runtime view stack', () => {
  it('requires a non-dismissible root view', () => {
    expect(() => createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: true,
      blocksBelow: false,
    })).toThrow(/root view/i);
  });

  it('creates a first-class root view and exposes the active runtime view', () => {
    const stack = createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      blocksBelow: false,
    });

    expect(stack.layers).toHaveLength(1);
    expect(stack.layers[0]).toMatchObject({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      root: true,
    });
    expect(activeRuntimeView(stack)?.id).toBe('workspace');
  });

  it('pushes overlays without altering the state-machine state', () => {
    const machine = createRuntimeStateMachine({
      id: 'docs.browsing',
      storyId: 'alert',
    });
    const stack = createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      blocksBelow: false,
    });

    const nextStack = pushRuntimeView(stack, {
      id: 'confirm-modal',
      kind: 'modal',
      dismissible: true,
      blocksBelow: true,
    });

    expect(machine.current.id).toBe('docs.browsing');
    expect(nextStack.layers.map((layer) => layer.id)).toEqual(['workspace', 'confirm-modal']);
    expect(activeRuntimeView(nextStack)?.id).toBe('confirm-modal');
  });

  it('never pops the root view', () => {
    const baseOnly = createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      blocksBelow: false,
    });
    const poppedBaseOnly = popRuntimeView(baseOnly);

    expect(poppedBaseOnly.popped).toBeUndefined();
    expect(poppedBaseOnly.stack.layers).toHaveLength(1);

    const stacked = pushRuntimeView(baseOnly, {
      id: 'help',
      kind: 'help',
      dismissible: true,
      blocksBelow: true,
    });
    const poppedOverlay = popRuntimeView(stacked);

    expect(poppedOverlay.popped?.id).toBe('help');
    expect(poppedOverlay.stack.layers.map((layer) => layer.id)).toEqual(['workspace']);
  });

  it('replaces the top view without rewriting the root view', () => {
    const stack = pushRuntimeView(createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      blocksBelow: false,
    }), {
      id: 'confirm-modal',
      kind: 'modal',
      dismissible: true,
      blocksBelow: true,
    });

    const next = replaceTopRuntimeView(stack, {
      id: 'search',
      kind: 'search',
      dismissible: true,
      blocksBelow: true,
    });

    expect(next.layers.map((layer) => layer.id)).toEqual(['workspace', 'search']);
    expect(next.layers[0]?.root).toBe(true);
  });

  it('does not allow replace-top to rewrite the root view accidentally', () => {
    const stack = createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      blocksBelow: false,
    });

    expect(() => replaceTopRuntimeView(stack, {
      id: 'summary',
      kind: 'summary',
      dismissible: false,
      blocksBelow: false,
    })).toThrow(/root view/i);
  });

  it('clears back to the root view without deleting it', () => {
    const stack = pushRuntimeView(pushRuntimeView(createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      blocksBelow: false,
    }), {
      id: 'search',
      kind: 'search',
      dismissible: true,
      blocksBelow: true,
    }), {
      id: 'help',
      kind: 'help',
      dismissible: true,
      blocksBelow: true,
    });

    const cleared = clearRuntimeViewsToRoot(stack);
    expect(cleared.layers.map((layer) => layer.id)).toEqual(['workspace']);
    expect(cleared.layers[0]?.root).toBe(true);
  });

  it('replaces the root view explicitly while preserving overlays above it', () => {
    const stack = pushRuntimeView(createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      blocksBelow: false,
    }), {
      id: 'summary-modal',
      kind: 'modal',
      dismissible: true,
      blocksBelow: true,
    });

    const next = replaceRuntimeRootView(stack, {
      id: 'post-session',
      kind: 'summary',
      dismissible: false,
      blocksBelow: false,
    });

    expect(next.layers.map((layer) => layer.id)).toEqual(['post-session', 'summary-modal']);
    expect(next.layers[0]).toMatchObject({ root: true, dismissible: false });
    expect(next.layers[1]).toMatchObject({ root: false, dismissible: true });
  });
});

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

describe('runtime input routing', () => {
  function layoutNode(id: string, x: number, y: number, width: number, height: number, children: LayoutNode[] = []): LayoutNode {
    return {
      id,
      rect: { x, y, width, height },
      children,
    };
  }

  it('routes key input topmost-first and stops on handled input', () => {
    const stack = pushRuntimeView(createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      blocksBelow: false,
    }), {
      id: 'search',
      kind: 'search',
      dismissible: true,
      blocksBelow: true,
    });
    const layouts = retainRuntimeLayout(retainRuntimeLayout(createRuntimeRetainedLayouts(), {
      viewId: 'workspace',
      tree: layoutNode('workspace-root', 0, 0, 80, 24),
    }), {
      viewId: 'search',
      tree: layoutNode('search-root', 10, 2, 40, 10),
    });
    const visited: string[] = [];

    const result = routeRuntimeInput(stack, layouts, {
      kind: 'key',
      key: 'Enter',
    }, ({ layer }) => {
      visited.push(layer.id);
      if (layer.id === 'search') {
        return {
          handled: true,
          commands: ['search.select'],
          effects: ['announce.match'],
        };
      }

      return undefined;
    });

    expect(visited).toEqual(['search']);
    expect(result).toMatchObject({
      handled: true,
      handledByViewId: 'search',
      commands: ['search.select'],
      effects: ['announce.match'],
    });
  });

  it('bubbles unhandled input through non-blocking views', () => {
    const stack = pushRuntimeView(createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      blocksBelow: false,
    }), {
      id: 'tooltip',
      kind: 'tooltip',
      dismissible: true,
      blocksBelow: false,
    });
    const layouts = retainRuntimeLayout(retainRuntimeLayout(createRuntimeRetainedLayouts(), {
      viewId: 'workspace',
      tree: layoutNode('workspace-root', 0, 0, 80, 24),
    }), {
      viewId: 'tooltip',
      tree: layoutNode('tooltip-root', 5, 1, 20, 4),
    });
    const visited: string[] = [];

    const result = routeRuntimeInput(stack, layouts, {
      kind: 'key',
      key: 'j',
    }, ({ layer }) => {
      visited.push(layer.id);
      if (layer.id === 'workspace') {
        return {
          handled: true,
          commands: ['workspace.down'],
        };
      }

      return undefined;
    });

    expect(visited).toEqual(['tooltip', 'workspace']);
    expect(result).toMatchObject({
      handled: true,
      handledByViewId: 'workspace',
      commands: ['workspace.down'],
    });
  });

  it('stops unhandled input at a blocking topmost view', () => {
    const stack = pushRuntimeView(createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      blocksBelow: false,
    }), {
      id: 'modal',
      kind: 'modal',
      dismissible: true,
      blocksBelow: true,
    });
    const layouts = retainRuntimeLayout(retainRuntimeLayout(createRuntimeRetainedLayouts(), {
      viewId: 'workspace',
      tree: layoutNode('workspace-root', 0, 0, 80, 24),
    }), {
      viewId: 'modal',
      tree: layoutNode('modal-root', 20, 4, 30, 8),
    });
    const visited: string[] = [];

    const result = routeRuntimeInput(stack, layouts, {
      kind: 'key',
      key: 'Escape',
    }, ({ layer }) => {
      visited.push(layer.id);
      return undefined;
    });

    expect(visited).toEqual(['modal']);
    expect(result).toMatchObject({
      handled: false,
      stoppedByViewId: 'modal',
      visitedViewIds: ['modal'],
    });
  });

  it('uses retained layout geometry to expose the deepest hit node for pointer input', () => {
    const stack = pushRuntimeView(createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      blocksBelow: false,
    }), {
      id: 'palette',
      kind: 'palette',
      dismissible: true,
      blocksBelow: false,
    });
    const layouts = retainRuntimeLayout(retainRuntimeLayout(createRuntimeRetainedLayouts(), {
      viewId: 'workspace',
      tree: layoutNode('workspace-root', 0, 0, 80, 24, [
        layoutNode('workspace-button', 2, 2, 10, 3),
      ]),
    }), {
      viewId: 'palette',
      tree: layoutNode('palette-root', 10, 2, 40, 10, [
        layoutNode('palette-list', 12, 4, 20, 4, [
          layoutNode('palette-row-1', 12, 4, 20, 1),
          layoutNode('palette-row-2', 12, 5, 20, 1),
        ]),
      ]),
    });

    const result = routeRuntimeInput(stack, layouts, {
      kind: 'pointer',
      action: 'press',
      button: 'left',
      x: 16,
      y: 5,
    }, ({ layer, hit }) => {
      if (layer.id === 'palette') {
        return {
          handled: true,
          commands: [`select:${hit?.target.id}`],
          effects: [`flash:${hit?.path.map((node) => node.id).join('>')}`],
        };
      }

      return undefined;
    });

    expect(result.hit?.target.id).toBe('palette-row-2');
    expect(result.hit?.path.map((node) => node.id)).toEqual([
      'palette-root',
      'palette-list',
      'palette-row-2',
    ]);
    expect(result).toMatchObject({
      handled: true,
      handledByViewId: 'palette',
      handledByNodeId: 'palette-row-2',
      commands: ['select:palette-row-2'],
    });
  });
});
