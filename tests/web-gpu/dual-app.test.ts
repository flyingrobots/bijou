import { isWideUnitGlyph } from '@flyingrobots/geordi-bijou-gpu';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { createSemanticSceneController, type KeyMsg } from '@flyingrobots/bijou-tui';
import { describe, expect, it } from 'vitest';
import { isPackedSurface, type Surface, type UiSceneIr } from '../../packages/bijou/src/index.js';
import { createDualApp, type DualModel } from '../../examples/web-gpu/src/dual/dual-app.js';

// The dual-host counter is one app with two projections: view() paints the
// Surface the canvas shows, viewScene() the scene the DOM host lowers. For
// every model in the table both must say the same thing.
const ctx = createTestContext();
const app = createDualApp(ctx);

function surfaceText(surface: Surface): string {
  const rows: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let row = '';
    for (let x = 0; x < surface.width; x++) row += surface.get(x, y).char;
    rows.push(row);
  }
  return rows.join('\n');
}

function painted(model: DualModel): string {
  const surface = app.view(model);
  if (!('get' in surface)) throw new Error('the dual-host counter paints a Surface');
  return surfaceText(surface);
}

const sceneText = (scene: UiSceneIr, id: string): string | undefined => {
  const node = scene.nodes.find((entry) => entry.id === id);
  return node?.text?.kind === 'literal' ? node.text.value : undefined;
};

const MODELS: readonly (readonly [DualModel, string])[] = [
  [{ count: 0, name: '', enabled: true }, 'No name yet'],
  [{ count: 5, name: 'Ada', enabled: true }, 'Hello, Ada'],
  [{ count: -3, name: 'a b', enabled: false }, 'Hello, a b'],
  [{ count: 1234, name: 'x'.repeat(32), enabled: false }, `Hello, ${'x'.repeat(32)}`],
];

const key = (name: string): KeyMsg => ({ type: 'key', key: name, ctrl: false, alt: false, shift: false });

describe('examples/web-gpu dual-host counter', () => {
  it.each(MODELS)('paints and describes %j alike', (model, greeting) => {
    const scene = app.viewScene(model, ctx);
    const text = painted(model);
    const count = `Count ${String(model.count)}`;
    expect(sceneText(scene, 'app.count')).toBe(count);
    expect(text).toContain(count);
    expect(sceneText(scene, 'app.greeting')).toBe(greeting);
    expect(text).toContain(greeting);
    expect(sceneText(scene, 'app.name')).toBe(model.name);
    const switched = model.enabled ? 'On' : 'Off';
    expect(sceneText(scene, 'app.enabled')).toBe(switched);
    expect(scene.nodes.find((node) => node.id === 'app.enabled')?.state).toEqual({ checked: model.enabled });
    expect(text).toContain(`Switch: ${switched}`);
  });

  it('lowers to group and text nodes only, and declares an action for each control', () => {
    const scene = app.viewScene({ count: 0, name: '', enabled: true }, ctx);
    expect(new Set(scene.nodes.map((node) => node.kind))).toEqual(new Set(['group', 'text']));
    expect(scene.actions.map((action) => [action.id, action.command])).toEqual([
      ['app.increment', 'increment'], ['app.decrement', 'decrement'], ['app.name', 'rename'], ['app.enabled', 'toggle'],
    ]);
  });

  it('paints a name the canvas cannot hold with one cell per grapheme, and the scene keeps it whole', () => {
    const model: DualModel = { count: 2, name: 'ab日本🙂', enabled: true };
    expect(painted(model)).toContain('Hello, ab???');
    expect(sceneText(app.viewScene(model, ctx), 'app.greeting')).toBe('Hello, ab日本🙂');
    expect(painted({ ...model, name: 'y'.repeat(40) })).toContain(`Hello, ${'y'.repeat(31)}…`);
    const surface = app.view({ ...model, name: '日本'.repeat(30) });
    if (!('get' in surface)) throw new Error('the dual-host counter paints a Surface');
    expect(isPackedSurface(surface)).toBe(true);
    expect(Array.from(surfaceText(surface)).filter((char) => isWideUnitGlyph(char))).toEqual([]);
  });

  it('takes the counter keys and t as key messages', () => {
    let model: DualModel = { count: 0, name: '', enabled: true };
    for (const name of ['k', '+', 'up', 'k', 'j', '-', 'down', 't', 'x']) [model] = app.update(key(name), model);
    expect(model).toEqual({ count: 1, name: '', enabled: false });
    const [same] = app.update({ ...key('k'), ctrl: true }, model);
    expect(same).toBe(model);
  });

  it('takes the scene actions through the controller: increment, decrement, rename and toggle', () => {
    const controller = createSemanticSceneController(app, { ctx });
    for (const actionId of ['app.increment', 'app.increment', 'app.decrement', 'app.enabled']) controller.invoke({ actionId });
    controller.invoke({ actionId: 'app.name', value: 'Ada' });
    expect(controller.frame().model).toEqual({ count: 1, name: 'Ada', enabled: false });
    expect(sceneText(controller.frame().scene, 'app.greeting')).toBe('Hello, Ada');
    controller.stop();
  });
});
