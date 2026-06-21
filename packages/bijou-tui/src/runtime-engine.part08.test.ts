import { describe, expect, it } from 'vitest';
import { createRuntimeComponentContract, createRuntimeComponentNode, handleRuntimeComponentInput, runtimeComponentAcceptsInput } from './runtime-engine.js';

describe('runtime component contracts', () => {
  it('lets component handlers emit multiple commands and effects', () => {
      const component = createRuntimeComponentContract<string, string>({
        componentId: 'confirm.primary',
        interaction: {
          pointerActions: ['press'],
          handleInput: ({ component, node }) => ({
            handled: true,
            commands: [`activate:${component.componentId}`, `focus:${node.id ?? ''}`],
            effects: ['play-click'],
          }),
        },
      });
      const node = createRuntimeComponentNode<string, string>({
        id: 'confirm-primary',
        rect: { x: 8, y: 5, width: 10, height: 1 },
        component,
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
        component,
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
