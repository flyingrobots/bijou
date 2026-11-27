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

function setup() {
  const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 80 } });
  const app = createFramedApp<{ readonly n: number }, Msg>({
    ctx,
    title: 'inspect',
    pages: [{
      id: 'list', title: 'List',
      init: () => [{ n: 0 }, []],
      update: (_msg, model) => [model, []],
      keyMap: createKeyMap<Msg>().bind('j', 'Next item', { type: 'down' }).bind('enter', 'Select', { type: 'select' }),
      layout: () => ({ kind: 'pane', paneId: 'body', render: (width, height) => createSurface(width, height) }),
    }],
  });
  // The frame takes its size from resize messages, as the runtime sends them.
  const model = app.update({ type: 'resize', columns: 120, rows: 80 }, app.init()[0])[0];
  const press = (m: typeof model, name: string): typeof model => app.update(key(name), m)[0];
  return { app, model, press };
}

describe('the frame key inspector (F9)', () => {
  it('stays clear of the header and footer rows', () => {
    const { app, model, press } = setup();
    const view = app.view(press(model, 'f9'));
    const rows = textOf(view).split('\n');
    expect(rows[0]).not.toContain('┌');
    expect(rows.at(-1)).not.toContain('┘');
  });

  it('opens on F9 and closes on F9 again', () => {
    const { app, model, press } = setup();
    expect(textOf(app.view(model))).not.toContain('Key Inspector');
    const open = press(model, 'f9');
    expect(textOf(app.view(open))).toContain('Key Inspector');
    expect(textOf(app.view(press(open, 'f9')))).not.toContain('Key Inspector');
  });

  it('names every binding that can never fire, and what takes its key, near the top', () => {
    const { app, model, press } = setup();
    const text = textOf(app.view(press(model, 'f9')));
    expect(text).toContain('frame-first');
    expect(text).toContain('shadowed (1)');
    expect(text).toMatch(/j\s+page list: Next item ✗ frame \(Scroll down\)/u);
    expect(text).not.toMatch(/enter\s+page list: Select/u);
  });

  it('lists the sources in routing order for the key priority', () => {
    const { app, model, press } = setup();
    const text = textOf(app.view(press(model, 'f9')));
    // frame-first: the frame is consulted before the page.
    const frame = text.indexOf('frame (');
    const page = text.indexOf('page list (');
    expect(frame).toBeGreaterThan(0);
    expect(page).toBeGreaterThan(frame);
  });

  it('lists the keys the frame routed and where each went', () => {
    const { app, model, press } = setup();
    const after = press(press(press(model, 'f9'), 'j'), 'enter');
    const text = textOf(app.view(after));
    expect(text).toMatch(/j\s+→ frame/u);
    expect(text).toMatch(/Enter\s+→ page/u);
    // Newest first.
    expect(text.indexOf('Enter        → page')).toBeLessThan(text.indexOf('j            → frame'));
  });
});
