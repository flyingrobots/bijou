import { describe, expect, it } from 'vitest';
import {
  lowerUiSceneToBrowser,
  type UiSceneBrowserElement,
} from './ui-scene-browser.js';
import {
  debuggerScene,
  withNode,
} from './ui-scene-browser.test-support.js';
import { stableUiSceneStringify } from './ui-scene-ir.js';

function flatten(
  element: UiSceneBrowserElement,
): readonly UiSceneBrowserElement[] {
  return [element, ...element.children.flatMap(flatten)];
}

function values(root: UiSceneBrowserElement, name: string): readonly string[] {
  return flatten(root).flatMap((element) =>
    element.attributes
      .filter((entry) => entry.name === name)
      .map((entry) => entry.value),
  );
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

describe('ui-scene-ir/1 browser seam facts', () => {
  it('emits only node ids, action ids and text the scene declares', () => {
    const { root } = lowerUiSceneToBrowser(debuggerScene);
    expect(values(root, 'data-bijou-node-id')).toEqual(
      debuggerScene.nodes.map((node) => node.id),
    );
    expect(values(root, 'data-bijou-action')).toEqual(['debugger.step']);
    expect(values(root, 'data-bijou-binding')).toEqual([
      'debugger.tick.value',
    ]);
    expect(
      flatten(root).flatMap((element) =>
        element.text == null ? [] : [element.text],
      ),
    ).toEqual(['Debugger', 'Tick 12 <paused> & "held"', 'Step']);
  });

  it('names a binding without resolving it into state', () => {
    const lowered = lowerUiSceneToBrowser(debuggerScene);
    const unbound = lowerUiSceneToBrowser({ ...debuggerScene, bindings: [] });
    expect(lowered.markup).toContain('Tick 12 &lt;paused&gt;');
    expect(unbound.markup).toBe(
      lowered.markup.replace(' data-bijou-binding="debugger.tick.value"', ''),
    );
  });

  it('changes output only when a scene fact changes', () => {
    const before = lowerUiSceneToBrowser(debuggerScene);
    const after = lowerUiSceneToBrowser(
      withNode(debuggerScene, 'debugger.tick', {
        text: { kind: 'literal', value: 'Tick 13' },
      }),
    );
    expect(after.markup).toBe(
      before.markup.replace(
        'Tick 12 &lt;paused&gt; &amp; "held"',
        'Tick 13',
      ),
    );
    expect(after.markupHash).not.toBe(before.markupHash);
  });

  it('reads a frozen scene without changing it', () => {
    const frozen = deepFreeze(
      structuredClone(debuggerScene),
    );
    const before = stableUiSceneStringify(frozen);
    expect(() => lowerUiSceneToBrowser(frozen)).not.toThrow();
    expect(stableUiSceneStringify(frozen)).toBe(before);
  });

  it('lists an action that targets a node the node does not list', () => {
    const scene = withNode(debuggerScene, 'debugger.step', { actions: [] });
    const { root } = lowerUiSceneToBrowser(scene);
    expect(values(root, 'data-bijou-action')).toEqual(['debugger.step']);
  });

  it('resolves token colors only from the supplied table', () => {
    const plain = lowerUiSceneToBrowser(debuggerScene);
    const colored = lowerUiSceneToBrowser(debuggerScene, {
      tokenColors: {
        'semantic.action.fg': '#ffffff',
        'semantic.action.bg': '#0A3D62',
      },
    });
    expect(plain.markup).not.toContain('color:');
    expect(colored.markup).toContain(
      'style="--bijou-x:2;--bijou-y:2;color:#ffffff;background-color:#0A3D62"',
    );
    expect(colored.markup).toContain(
      'data-bijou-modifiers="bold" style="--bijou-x:0;--bijou-y:0">',
    );
  });

  it('lowers the inspection modes the terminal renderer has', () => {
    const ids = lowerUiSceneToBrowser(debuggerScene, {
      lowerMode: 'node-ids',
    });
    const keys = lowerUiSceneToBrowser(debuggerScene, {
      lowerMode: 'i18n-keys',
    });
    const tokens = lowerUiSceneToBrowser(debuggerScene, {
      lowerMode: 'token-refs',
    });
    expect(ids.markup).toContain('>debugger.tick</span>');
    expect(keys.markup).toContain('>debugger.title</span>');
    expect(tokens.markup).toContain(
      '>semantic.action.fg semantic.action.bg</span>',
    );
  });
});
