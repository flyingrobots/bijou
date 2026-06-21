import type { LayoutNode } from '@flyingrobots/bijou';
import { describe, expect, it } from 'vitest';
import { createRuntimeRetainedLayouts, createRuntimeViewStack, pushRuntimeView, routeRuntimeInput, retainRuntimeLayout } from './runtime-engine.js';

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
});
