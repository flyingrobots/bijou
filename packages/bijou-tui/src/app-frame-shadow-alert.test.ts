import { createSurface, type Surface } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { describe, expect, it } from 'vitest';
import { createFramedApp } from './app-frame.js';
import { createKeyMap } from './keybindings.js';
import type { KeyMsg } from './types.js';
import type { ViewOutput } from './view-output.js';

type Msg = { readonly type: 'down' } | { readonly type: 'select' };

const key = (name: string): KeyMsg => ({ type: 'key', key: name, ctrl: false, alt: false, shift: false });

function textOf(view: ViewOutput): string {
  if ('rect' in view) throw new Error('expected a Surface');
  const surface: Surface = view;
  const rows: string[] = [];
  for (let y = 0; y < surface.height; y += 1) {
    let row = '';
    for (let x = 0; x < surface.width; x += 1) row += surface.get(x, y).char;
    rows.push(row);
  }
  return rows.join('\n');
}

/** A page whose `j` the frame takes first, and whose pulses count, so a halt is visible in the model. */
function setup(debug: boolean, pageKey = 'j', keyPriority: 'frame-first' | 'page-first' = 'frame-first') {
  const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
  const app = createFramedApp<{ readonly pulses: number }, Msg>({
    ctx,
    title: 'debug',
    debug,
    keyPriority,
    pages: [{
      id: 'list', title: 'List',
      init: () => [{ pulses: 0 }, []],
      update: (msg, model) => [msg.type === 'pulse' ? { pulses: model.pulses + 1 } : model, []],
      keyMap: createKeyMap<Msg>().bind(pageKey, 'Next item', { type: 'down' }).bind('enter', 'Select', { type: 'select' }),
      layout: () => ({ kind: 'pane', paneId: 'body', render: (width, height) => createSurface(width, height) }),
    }],
  });
  const model = app.update({ type: 'resize', columns: 120, rows: 40 }, app.init()[0])[0];
  return { app, model };
}

describe('debug mode halts on shadowed key bindings', () => {
  it('opens a modal dialog naming each binding that can never fire', () => {
    const { app, model } = setup(true);
    expect(model.shadowAlert?.count).toBe(1);
    const text = textOf(app.view(model));
    expect(text).toContain('Debug: shadowed key bindings');
    expect(text).toContain('j — page list: "Next item" never fires');
  });

  it('names the bad guy and why it wins', () => {
    const { app, model } = setup(true);
    expect(textOf(app.view(model))).toContain('bad guy: frame "Scroll down" — asked first under \'frame-first\'');
  });

  it('says how to fix it, offering a key no source uses', () => {
    const { app, model } = setup(true);
    const text = textOf(app.view(model));
    // "Next item": n is free (the frame uses no n), so it is the first suggestion.
    expect(text).toContain('fix: bind "Next item" to n, or pass keyPriority: \'page-first\'');
  });

  it('holds keys, mouse and pulses while the dialog is open', () => {
    const { app, model } = setup(true);
    const afterPulse = app.update({ type: 'pulse', dt: 16 }, model)[0];
    const afterKey = app.update(key('?'), model)[0];
    const afterMouse = app.update({ type: 'mouse', action: 'press', button: 'left', col: 5, row: 5, ctrl: false, alt: false, shift: false }, model)[0];
    for (const next of [afterPulse, afterKey, afterMouse]) expect(next).toBe(model);
  });

  it('continues on Enter or Esc, and the same conflicts do not halt again', () => {
    const { app, model } = setup(true);
    for (const name of ['enter', 'escape']) {
      const continued = app.update(key(name), model)[0];
      expect(continued.shadowAlert).toBeUndefined();
      const later = app.update({ type: 'pulse', dt: 16 }, continued)[0];
      expect(later.shadowAlert).toBeUndefined();
      expect(textOf(app.view(later))).not.toContain('Debug: shadowed key bindings');
    }
  });

  it('opens the key inspector from the dialog with F9', () => {
    const { app, model } = setup(true);
    const inspecting = app.update(key('f9'), model)[0];
    expect(inspecting.shadowAlert).toBeDefined();
    expect(textOf(app.view(inspecting))).toContain('Key Inspector');
  });

  it('does not halt when a page deliberately overrides a frame key under page-first', () => {
    expect(setup(true, 'j', 'page-first').model.shadowAlert).toBeUndefined();
  });

  it('does nothing outside debug mode, or when no binding is shadowed', () => {
    expect(setup(false).model.shadowAlert).toBeUndefined();
    expect(setup(true, 'x').model.shadowAlert).toBeUndefined();
  });
});
