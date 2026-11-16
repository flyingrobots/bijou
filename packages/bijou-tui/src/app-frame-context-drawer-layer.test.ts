import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { createKeyMap } from './keybindings.js';
import { createFramedApp } from './app-frame.js';
import { projectFrameControls } from './app-frame-layers.js';
import { textView, type Msg, type PageModel } from './app-frame.test-support.part01.js';
import type { FramePage } from './app-frame-page-contract.js';

const CLOSED = {
  helpOpen: false,
  commandPalette: undefined,
  commandPaletteKind: undefined,
  settingsOpen: false,
  notificationCenterOpen: false,
  quitConfirmOpen: false,
} as const;

const drawerHelp = createKeyMap<Msg>().bind('escape', 'Close drawer', { type: 'noop' });

describe('context-drawer frame layer', () => {
  it('sits directly above workspace and below every Overlay layer', () => {
    const layers = { 'context-drawer': { hintSource: 'Drawer hint', helpSource: drawerHelp } };
    const focused = projectFrameControls(CLOSED, { contextDrawerFocused: true, layers });
    expect(focused.layerStack.map((layer) => layer.kind)).toEqual(['workspace', 'context-drawer']);
    expect(focused.activeLayer).toMatchObject({
      owner: 'page',
      dismissible: true,
      blocksUnderlyingInput: false,
      inputMapId: 'page-context-drawer',
    });
    expect(focused.footerHintSource).toBe('Drawer hint');

    const withHelp = projectFrameControls({ ...CLOSED, helpOpen: true, quitConfirmOpen: true }, {
      contextDrawerFocused: true,
      pageModalOpen: true,
      layers,
    });
    expect(withHelp.layerStack.map((layer) => layer.kind)).toEqual([
      'workspace', 'context-drawer', 'page-modal', 'help', 'quit-confirm',
    ]);
    expect(projectFrameControls(CLOSED, { layers }).layerStack.map((layer) => layer.kind)).toEqual(['workspace']);
  });

  it('enters the stack only while the page drawer pane has focus', () => {
    const page: FramePage<PageModel, Msg> = {
      id: 'docs',
      title: 'Docs',
      init: () => [{ count: 0 }, []],
      update: (_msg, model) => [model, []],
      layout: () => ({
        kind: 'split',
        splitId: 'docs-split',
        direction: 'row',
        state: { ratio: 0.5, focused: 'a' },
        paneA: { kind: 'pane', paneId: 'content', render: () => textView('content') },
        paneB: { kind: 'pane', paneId: 'drawer', render: () => textView('drawer') },
      }),
      layers: () => ({ 'context-drawer': { paneId: 'drawer', hintSource: 'DRAWER-HINT' } }),
    };
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 100, rows: 20 } });
    const app = createFramedApp<PageModel, Msg>({ ctx, pages: [page], initialColumns: 100, initialRows: 20 });
    const text = (surface: ReturnType<typeof app.view>) => {
      if (typeof surface === 'string' || !('get' in surface)) throw new Error('Expected a Surface view.');
      return Array.from({ length: surface.height }, (_, y) =>
        Array.from({ length: surface.width }, (_, x) => surface.get(x, y).char).join('')).join('\n');
    };
    const [initial] = app.init();
    expect(initial.focusedPaneByPage['docs']).toBe('content');
    expect(text(app.view(initial))).not.toContain('DRAWER-HINT');
    const [onDrawer] = app.update({ type: 'key', key: 'tab', ctrl: false, alt: false, shift: false }, initial);
    expect(onDrawer.focusedPaneByPage['docs']).toBe('drawer');
    expect(text(app.view(onDrawer))).toContain('DRAWER-HINT');
  });
});
