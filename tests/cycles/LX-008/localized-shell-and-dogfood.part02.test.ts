import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { stringToSurface } from '@flyingrobots/bijou';
import * as i18nMod from '../../../packages/bijou-i18n/src/index.js';
import * as tui from '../../../packages/bijou-tui/src/index.js';

const KEY_F2 = '\x1bOQ';

interface TestMsg { readonly type: 'noop' }

interface TestModel { readonly count: number }

interface TestFrame { readonly width: number; readonly height: number; get(x: number, y: number): { readonly char?: string } }

const noopAction: TestMsg = { type: 'noop' };

function frameText(frame: TestFrame): string {
  let text = '';
  for (let y = 0; y < frame.height; y += 1) {
    for (let x = 0; x < frame.width; x += 1) {
      text += frame.get(x, y).char ?? ' ';
    }
    text += '\n';
  }
  return text;
}

function lastFrame(frames: readonly TestFrame[]): TestFrame {
  const frame = frames.at(-1);
  if (frame == null) throw new Error('expected rendered frame');
  return frame;
}

function firstColumnOf(text: string, needle: string): number {
  const lines = text.split('\n');
  for (const line of lines) {
    const index = line.indexOf(needle);
    if (index >= 0) {
      return index;
    }
  }
  return -1;
}

describe('LX-008 localized shell chrome and DOGFOOD cycle', () => {
  it('uses i18n direction metadata to mirror the settings drawer anchor', async () => {
      function makeApp(direction: 'ltr' | 'rtl') {
        const runtime = i18nMod.createI18nRuntime({ locale: direction === 'rtl' ? 'ar' : 'en', direction });
        runtime.loadCatalog(tui.FRAME_I18N_CATALOG);
        return tui.createFramedApp<TestModel, TestMsg>({
          i18n: runtime,
          pages: [{
            id: 'home',
            title: 'Home',
            init: () => [{ count: 0 }, []],
            update: (_msg, model) => [model, []],
            layout: () => ({
              kind: 'pane',
              paneId: 'main',
              render: () => stringToSurface('body', 4, 1),
            }),
          }],
          settings: () => ({
            sections: [{
              id: 'shell',
              title: 'Shell',
              rows: [{ id: 'show-hints', label: 'Show hints', checked: true, kind: 'toggle', action: noopAction }],
            }],
          }),
        });
      }
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 100, rows: 30 } });
      const ltr = await tui.runScript(makeApp('ltr'), [{ key: KEY_F2 }], { ctx });
      const rtl = await tui.runScript(makeApp('rtl'), [{ key: KEY_F2 }], { ctx });
      const ltrColumn = firstColumnOf(frameText(lastFrame(ltr.frames)), 'Settings');
      const rtlColumn = firstColumnOf(frameText(lastFrame(rtl.frames)), 'Settings');
      expect(ltrColumn).toBeGreaterThanOrEqual(0);
      expect(rtlColumn).toBeGreaterThanOrEqual(0);
      expect(ltrColumn).toBeLessThan(40);
      expect(rtlColumn).toBeGreaterThan(55);
    });
});
