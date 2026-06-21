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
            commands: [`select:${hit?.target.id ?? ''}`],
            effects: [`flash:${hit?.path.map((node) => node.id).join('>') ?? ''}`],
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
