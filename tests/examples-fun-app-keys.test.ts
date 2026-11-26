import { describe, expect, it } from 'vitest';
import { QUIT, type KeyMsg } from '@flyingrobots/bijou-tui';
import { starfieldDemo } from '../examples/fun/demos/starfield.js';
import { surfaceDemo } from '../examples/fun/demos/surface.js';
import { demoPaneKeys } from '../examples/fun/demos-page.js';
import { createFunApp } from '../examples/fun/fun-app.js';
import type { DemosModel, FunModel } from '../examples/fun/fun-app-types.js';
import { funContext } from './helpers/fun-demos.js';

const ctx = funContext(100, 30);

function demos(model: FunModel): DemosModel {
  if (model.kind !== 'demos') throw new Error('expected the Demos page model');
  return model;
}

describe('keys in the fun app (the fix for shadowed Demos keys)', () => {
  const press = (name: string): KeyMsg => ({ type: 'key', key: name, ctrl: false, alt: false, shift: false });

  function funApp() {
    const app = createFunApp({ ctx, entries: [starfieldDemo, surfaceDemo], seed: 7, debug: true });
    let model = app.update({ type: 'resize', columns: 120, rows: 40 }, app.init()[0])[0];
    type AppMsg = Parameters<typeof app.update>[0];
    // As the runtime does: run each command and feed what it emits back into the app, until nothing is left.
    const send = (first: AppMsg): void => {
      const queue: AppMsg[] = [first];
      for (let guard = 0; queue.length > 0 && guard < 100; guard += 1) {
        const msg = queue.shift();
        if (msg === undefined) break;
        const [next, cmds] = app.update(msg, model);
        model = next;
        for (const cmd of cmds) {
          const result = cmd((emitted) => { queue.push(emitted); }, { onPulse: () => ({ dispose: () => undefined }) });
          // A command may also return its message, a quit signal or a cleanup handle; only a message goes back in.
          if (result === undefined || result instanceof Promise || result === QUIT || typeof result === 'function') continue;
          if (typeof result === 'object' && 'dispose' in result) continue;
          queue.push(result);
        }
      }
    };
    const demosModel = (): DemosModel => {
      const page = model.pageModels['demos'];
      if (page === undefined) throw new Error('the Demos page has no model');
      return demos(page);
    };
    return { app, send, get model() { return model; }, demosModel };
  }

  it('does not halt in debug mode: no binding is shadowed by accident', () => {
    expect(funApp().model.shadowAlert).toBeUndefined();
  });

  it('moves the Demos list with j and k, which the frame no longer takes', () => {
    const fun = funApp();
    fun.send(press(']'));
    expect(fun.model.activePageId).toBe('demos');
    fun.send(press('j'));
    expect(fun.demosModel().list.focusIndex).toBe(1);
    fun.send(press('k'));
    expect(fun.demosModel().list.focusIndex).toBe(0);
  });

  it('gives a focused demo pane the demo\'s keys, and keeps the frame\'s reserved keys', () => {
    const fun = funApp();
    fun.send(press(']'));
    fun.send(press('tab'));
    expect(fun.model.focusedPaneByPage['demos']).toBe('demo');
    // space is the demo session's pause key: it reaches the demo through the pane.
    fun.send(press('space'));
    expect(fun.demosModel().session.paused).toBe(true);
    // ? stays the frame's help key.
    fun.send(press('?'));
    expect(fun.model.helpOpen).toBe(true);
  });
});

describe('the demo pane key map', () => {
  const keys = demoPaneKeys();
  const press = (name: string, mods: Partial<KeyMsg> = {}): KeyMsg => ({ type: 'key', key: name, ctrl: false, alt: false, shift: false, ...mods });

  it('forwards a demo\'s keys, including ones the frame binds', () => {
    for (const name of ['[', ']', 'r', 'h', 'j', '+']) expect(keys.handle(press(name))).toEqual({ type: 'demos-key', key: name });
  });

  it('leaves the frame\'s reserved keys to the frame', () => {
    for (const name of ['tab', '?', '`', 'f2', 'f9', ':', 'q']) expect(keys.handle(press(name))).toBeUndefined();
    expect(keys.handle(press('p', { ctrl: true }))).toBeUndefined();
    expect(keys.handle(press('tab', { shift: true }))).toBeUndefined();
  });
});
