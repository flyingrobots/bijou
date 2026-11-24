import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { createI18nRuntime, type I18nDirection } from '@flyingrobots/bijou-i18n';
import { createFramedApp } from './app-frame.js';
import { FRAME_I18N_CATALOG } from './app-frame-i18n.js';
import { serializeLayoutState, type SerializedLayoutState } from './layout-preset.js';
import { textView, type Msg, type PageModel } from './app-frame.test-support.part01.js';
import type { FramePage } from './app-frame-page-contract.js';
import type { KeyMsg, MouseMsg } from './types.js';

const COLUMNS = 41;
const BODY_ROW = 3;
const page: FramePage<PageModel, Msg> = {
  id: 'home',
  title: 'Home',
  init: () => [{ count: 0 }, []],
  update: (_msg, model) => [model, []],
  layout: () => ({
    kind: 'split', splitId: 's', state: { ratio: 0.5, focused: 'a' }, dividerChar: '¦',
    paneA: { kind: 'pane', paneId: 'start', render: () => textView('START') },
    paneB: { kind: 'pane', paneId: 'end', render: () => textView('END') },
  }),
};

function frame(direction: I18nDirection, initialLayout?: SerializedLayoutState) {
  const i18n = createI18nRuntime({ locale: 'en', direction });
  i18n.loadCatalog(FRAME_I18N_CATALOG);
  const ctx = createTestContext({ mode: 'interactive', runtime: { columns: COLUMNS, rows: 8 } });
  const app = createFramedApp<PageModel, Msg>({
    ctx, i18n, pages: [page], initialColumns: COLUMNS, initialRows: 8, ...(initialLayout ? { initialLayout } : {}),
  });
  const [model] = app.init();
  return { app, i18n, model };
}
type Frame = ReturnType<typeof frame>;
type Model = Frame['model'];
const click = (col: number): MouseMsg => ({
  type: 'mouse', action: 'press', button: 'left', col, row: BODY_ROW, shift: false, alt: false, ctrl: false,
});
const key = (name: string, mods: Partial<Pick<KeyMsg, 'ctrl' | 'shift'>> = {}): KeyMsg => ({
  type: 'key', key: name, ctrl: mods.ctrl ?? false, alt: false, shift: mods.shift ?? false,
});
function bodyLine(f: Frame, model: Model): string {
  const view = f.app.view(model);
  if (typeof view === 'string' || !('get' in view)) throw new Error('Expected a Surface view.');
  return Array.from({ length: view.width }, (_, x) => view.get(x, BODY_ROW).char).join('');
}
function press(f: Frame, model: Model, msg: KeyMsg | MouseMsg): Model {
  f.app.view(model);
  return f.app.update(msg, model)[0];
}
const focused = (model: Model) => model.focusedPaneByPage['home'];

describe('framed app split panes follow the frame direction', () => {
  it('draws the start pane on the physical right under rtl with the same divider offset from it', () => {
    const ltr = frame('ltr');
    const rtl = frame('rtl');
    expect(bodyLine(ltr, ltr.model).indexOf('¦')).toBe(20);
    expect(bodyLine(rtl, rtl.model).indexOf('¦')).toBe(20);
    expect(bodyLine(ltr, ltr.model).indexOf('START')).toBeLessThan(20);
    expect(bodyLine(rtl, rtl.model).indexOf('START')).toBeGreaterThan(20);
    expect(bodyLine(rtl, rtl.model).indexOf('END')).toBeLessThan(20);
  });

  it.each([['ltr', 'start', 'end'], ['rtl', 'end', 'start']] as const)(
    'mouse hits the pane drawn under the pointer (%s) and the divider focuses nothing',
    (direction, left, right) => {
      const f = frame(direction);
      expect(focused(press(f, f.model, click(5)))).toBe(left);
      const onRight = press(f, f.model, click(30));
      expect(focused(onRight)).toBe(right);
      expect(focused(press(f, onRight, click(20)))).toBe(right);
    },
  );

  it('re-hit-tests after the direction changes at runtime', () => {
    const f = frame('ltr');
    expect(focused(press(f, f.model, click(5)))).toBe('start');
    void f.i18n.setLocale('en', 'rtl');
    expect(focused(press(f, f.model, click(5)))).toBe('end');
    expect(bodyLine(f, f.model).indexOf('START')).toBeGreaterThan(20);
  });

  it.each(['ltr', 'rtl'] as const)('Tab and Shift+Tab move focus in logical order (%s)', (direction) => {
    const f = frame(direction);
    const next = press(f, f.model, key('tab'));
    expect(focused(next)).toBe('end');
    expect(focused(press(f, next, key('tab', { shift: true })))).toBe('start');
  });

  it('dock keys are physical: ctrl+shift+left moves the rtl start pane left, toward the logical end', () => {
    const rtl = frame('rtl');
    const blocked = press(rtl, rtl.model, key('right', { ctrl: true, shift: true }));
    expect(blocked.dockStateByPage['home']?.orderByContainer['s'] ?? ['start', 'end']).toEqual(['start', 'end']);
    const moved = press(rtl, rtl.model, key('left', { ctrl: true, shift: true }));
    expect(moved.dockStateByPage['home']?.orderByContainer['s']).toEqual(['end', 'start']);
    expect(bodyLine(rtl, moved).indexOf('START')).toBeLessThan(20);

    const ltr = frame('ltr');
    const ltrMoved = press(ltr, ltr.model, key('right', { ctrl: true, shift: true }));
    expect(ltrMoved.dockStateByPage['home']?.orderByContainer['s']).toEqual(['end', 'start']);
    expect(bodyLine(ltr, ltrMoved).indexOf('START')).toBeGreaterThan(20);
  });

  it('a serialized ratio is the start pane share in both directions and round-trips unchanged', () => {
    const saved = serializeLayoutState(frame('ltr').model, ['home'], { splitRatiosByPage: { home: { s: 0.25 } } });
    const ltr = frame('ltr', saved);
    const rtl = frame('rtl', saved);
    const ltrLine = bodyLine(ltr, ltr.model);
    const rtlLine = bodyLine(rtl, rtl.model);
    expect(ltrLine.indexOf('¦')).toBe(10);
    expect(rtlLine.indexOf('¦')).toBe(COLUMNS - 10 - 1);
    expect(serializeLayoutState(rtl.model, ['home'])).toEqual(saved);
    expect(serializeLayoutState(ltr.model, ['home'])).toEqual(saved);
  });
});
