import type { LayoutNode } from '@flyingrobots/bijou';
import { describe, expect, it } from 'vitest';
import {
  activeRuntimeView,
  appendRuntimeCommands,
  appendRuntimeEffects,
  applyRuntimeCommandBuffer,
  bufferRuntimeRouteResult,
  clearRuntimeViewsToRoot,
  createRuntimeComponentContract,
  createRuntimeComponentNode,
  createRuntimeBuffers,
  createRuntimeCommandBuffer,
  createRuntimeEffectBuffer,
  createRuntimeStateMachine,
  createRuntimeRetainedLayouts,
  createRuntimeViewStack,
  dropInactiveRuntimeLayouts,
  executeRuntimeEffectBuffer,
  getRuntimeRetainedLayout,
  getRuntimeComponentContract,
  handleRuntimeComponentInput,
  invalidateRuntimeLayouts,
  listRuntimeRetainedLayouts,
  popRuntimeView,
  pushRuntimeView,
  resolveRuntimeInteractiveTarget,
  routeRuntimeInput,
  retainRuntimeLayout,
  replaceRuntimeRootView,
  replaceTopRuntimeView,
  runtimeComponentAcceptsInput,
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

describe('runtime command and effect buffers', () => {
  it('creates explicit empty command and effect buffers', () => {
    expect(createRuntimeCommandBuffer<string>()).toEqual({
      items: [],
    });
    expect(createRuntimeEffectBuffer<string>()).toEqual({
      items: [],
    });
    expect(createRuntimeBuffers<string, string>()).toEqual({
      commands: { items: [] },
      effects: { items: [] },
    });
  });

  it('buffers route outputs without collapsing commands and effects together', () => {
    const buffered = bufferRuntimeRouteResult(createRuntimeBuffers<string, string>(), {
      handled: true,
      commands: ['open-modal', 'focus-confirm'],
      effects: ['play-click'],
      visitedViewIds: ['modal'],
    });

    expect(buffered.commands.items).toEqual(['open-modal', 'focus-confirm']);
    expect(buffered.effects.items).toEqual(['play-click']);
  });

  it('appends multiple route results in FIFO order', () => {
    const first = bufferRuntimeRouteResult(createRuntimeBuffers<string, string>(), {
      handled: true,
      commands: ['search.select'],
      effects: ['announce.selection'],
      visitedViewIds: ['search'],
    });

    const second = bufferRuntimeRouteResult(first, {
      handled: true,
      commands: ['workspace.focus', 'track.selection'],
      effects: ['flash.row'],
      visitedViewIds: ['workspace'],
    });

    expect(second.commands.items).toEqual([
      'search.select',
      'workspace.focus',
      'track.selection',
    ]);
    expect(second.effects.items).toEqual([
      'announce.selection',
      'flash.row',
    ]);
  });

  it('leaves buffers unchanged when a handled input emits nothing', () => {
    const initial = {
      commands: appendRuntimeCommands(createRuntimeCommandBuffer<string>(), ['keep.command']),
      effects: appendRuntimeEffects(createRuntimeEffectBuffer<string>(), ['keep.effect']),
    };

    const next = bufferRuntimeRouteResult(initial, {
      handled: true,
      commands: [],
      effects: [],
      visitedViewIds: ['workspace'],
    });

    expect(next).toEqual(initial);
  });

  it('applies buffered commands later in FIFO order and drains the command buffer', () => {
    const applied: string[] = [];
    const commandBuffer = appendRuntimeCommands(createRuntimeCommandBuffer<string>(), [
      'one',
      'two',
      'three',
    ]);

    const result = applyRuntimeCommandBuffer({ order: [] as string[] }, commandBuffer, (state, command) => {
      applied.push(command);
      return {
        order: [...state.order, command],
      };
    });

    expect(applied).toEqual(['one', 'two', 'three']);
    expect(result.state.order).toEqual(['one', 'two', 'three']);
    expect(result.applied).toEqual(['one', 'two', 'three']);
    expect(result.buffer).toEqual({ items: [] });
  });

  it('executes buffered effects later in FIFO order and drains the effect buffer', async () => {
    const executed: string[] = [];
    const effectBuffer = appendRuntimeEffects(createRuntimeEffectBuffer<string>(), [
      'play-click',
      'announce.confirm',
    ]);

    const result = await executeRuntimeEffectBuffer(effectBuffer, async (effect) => {
      executed.push(effect);
    });

    expect(executed).toEqual(['play-click', 'announce.confirm']);
    expect(result.executed).toEqual(['play-click', 'announce.confirm']);
    expect(result.buffer).toEqual({ items: [] });
  });
});

describe('runtime component contracts', () => {
  it('creates retained component nodes with explicit layout rules and overflow ownership', () => {
    const contract = createRuntimeComponentContract({
      componentId: 'confirm.primary-action',
      layout: {
        width: 'fill',
        height: 'content',
        alignX: 'stretch',
      },
      overflow: {
        inline: 'truncate',
        block: 'wrap',
      },
      interaction: {
        focusable: true,
        keyBindings: ['Enter'],
        pointerActions: ['press'],
      },
    });
    const node = createRuntimeComponentNode({
      id: 'primary-action',
      type: 'Button',
      rect: { x: 10, y: 8, width: 12, height: 1 },
      component: contract,
    });

    expect(getRuntimeComponentContract(node)).toMatchObject({
      componentId: 'confirm.primary-action',
      layout: {
        width: 'fill',
        height: 'content',
        alignX: 'stretch',
        alignY: 'start',
      },
      overflow: {
        inline: 'truncate',
        block: 'wrap',
      },
    });
  });

  it('prefers the deepest enabled interactive node in a retained hit path', () => {
    const root = createRuntimeComponentNode({
      id: 'confirm-root',
      rect: { x: 0, y: 0, width: 40, height: 10 },
      component: createRuntimeComponentContract({
        componentId: 'confirm.root',
        interaction: {
          pointerActions: ['press'],
        },
      }),
      children: [
        createRuntimeComponentNode({
          id: 'confirm-card',
          rect: { x: 5, y: 2, width: 20, height: 5 },
          component: createRuntimeComponentContract({
            componentId: 'confirm.card',
            interaction: {
              pointerActions: ['press'],
            },
          }),
          children: [
            createRuntimeComponentNode({
              id: 'confirm-primary',
              rect: { x: 8, y: 5, width: 10, height: 1 },
              component: createRuntimeComponentContract({
                componentId: 'confirm.primary',
                interaction: {
                  enabled: true,
                  pointerActions: ['press'],
                },
              }),
            }),
          ],
        }),
      ],
    });

    const hit = {
      viewId: 'modal',
      point: { x: 10, y: 5 },
      path: [
        root,
        root.children[0]!,
        root.children[0]!.children[0]!,
      ],
      target: root.children[0]!.children[0]!,
    };

    const target = resolveRuntimeInteractiveTarget(hit, {
      kind: 'pointer',
      action: 'press',
      button: 'left',
      x: 10,
      y: 5,
    });

    expect(target?.id).toBe('confirm-primary');
  });

  it('skips disabled or unsupported descendants and falls back to an enabled ancestor', () => {
    const root = createRuntimeComponentNode({
      id: 'scroll-card',
      rect: { x: 0, y: 0, width: 40, height: 10 },
      component: createRuntimeComponentContract({
        componentId: 'card.root',
        interaction: {
          pointerActions: ['press'],
        },
      }),
      children: [
        createRuntimeComponentNode({
          id: 'disabled-child',
          rect: { x: 2, y: 2, width: 10, height: 1 },
          component: createRuntimeComponentContract({
            componentId: 'card.disabled',
            interaction: {
              enabled: false,
              pointerActions: ['press'],
            },
          }),
        }),
      ],
    });

    const hit = {
      viewId: 'workspace',
      point: { x: 3, y: 2 },
      path: [root, root.children[0]!],
      target: root.children[0]!,
    };

    const target = resolveRuntimeInteractiveTarget(hit, {
      kind: 'pointer',
      action: 'press',
      button: 'left',
      x: 3,
      y: 2,
    });

    expect(target?.id).toBe('scroll-card');
  });

  it('lets component handlers emit multiple commands and effects', () => {
    const node = createRuntimeComponentNode<string, string>({
      id: 'confirm-primary',
      rect: { x: 8, y: 5, width: 10, height: 1 },
      component: createRuntimeComponentContract<string, string>({
        componentId: 'confirm.primary',
        interaction: {
          pointerActions: ['press'],
          handleInput: ({ component, node }) => ({
            handled: true,
            commands: [`activate:${component.componentId}`, `focus:${node.id}`],
            effects: ['play-click'],
          }),
        },
      }),
    });

    const result = handleRuntimeComponentInput({
      layer: {
        id: 'modal',
        kind: 'modal',
        dismissible: true,
        blocksBelow: true,
        root: false,
      },
      event: {
        kind: 'pointer',
        action: 'press',
        button: 'left',
        x: 8,
        y: 5,
      },
      node,
      component: node.component!,
    });

    expect(result).toEqual({
      handled: true,
      commands: ['activate:confirm.primary', 'focus:confirm-primary'],
      effects: ['play-click'],
    });
  });

  it('aligns scroll ownership with viewport overflow instead of ordinary block content', () => {
    const viewportList = createRuntimeComponentContract({
      componentId: 'list.viewport',
      overflow: {
        block: 'viewport',
      },
      interaction: {
        scrollable: true,
      },
    });
    const wrappedNote = createRuntimeComponentContract({
      componentId: 'note.body',
      overflow: {
        block: 'wrap',
      },
      interaction: {
        scrollable: true,
      },
    });

    expect(runtimeComponentAcceptsInput(viewportList, {
      kind: 'pointer',
      action: 'scroll-down',
      x: 5,
      y: 8,
    })).toBe(true);
    expect(runtimeComponentAcceptsInput(wrappedNote, {
      kind: 'pointer',
      action: 'scroll-down',
      x: 5,
      y: 8,
    })).toBe(false);
  });
});
