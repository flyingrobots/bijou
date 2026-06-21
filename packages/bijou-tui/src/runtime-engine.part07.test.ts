import { describe, expect, it } from 'vitest';
import { createRuntimeComponentContract, createRuntimeComponentNode, resolveRuntimeInteractiveTarget } from './runtime-engine.js';

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
      expect(node.component).toMatchObject({
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

  it('prefers the deepest enabled hit node', () => {
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
      const [card = root] = root.children;
      const [primary = card] = card.children;
      const hit = {
        viewId: 'modal',
        point: { x: 10, y: 5 },
        path: [root, card, primary],
        target: primary,
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
      const [disabledChild] = root.children;
      if (disabledChild == null) throw Error();
      const hit = {
        viewId: 'workspace',
        point: { x: 3, y: 2 },
        path: [root, disabledChild],
        target: disabledChild,
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
});
