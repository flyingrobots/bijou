import { afterAll, beforeAll, createFramedApp, createTestContext, colorHex, describe, expect, it, makePage, normalizeViewOutput, QUIT, setDefaultContext, _resetDefaultContextForTesting, Cmd, FramedAppMsg, Msg } from './app-frame.test-support.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();
  const ignoreFrameMsg = (_msg: FramedAppMsg<Msg>): void => { void _msg; };
  const commandRuntime = { onPulse: (handler: (dt: number) => void) => ({ dispose: () => { void handler; } }) };
  beforeAll(() => { setDefaultContext(testCtx); });
  afterAll(() => { _resetDefaultContextForTesting(); });
  it('uses provided settings theme tokens for drawer chrome and selected rows', () => {
      const app = createFramedApp({
        pages: [makePage('home', 'Home', 'main')],
        settings: () => ({
          borderToken: { hex: '#335577' },
          bgToken: { hex: '#223344', bg: '#112233' },
          listTheme: {
            sectionTitleToken: { hex: '#ffaa00' },
            selectedRowBgToken: { hex: '#102938', bg: '#102938' },
            toggleOnToken: { hex: '#ff66cc' },
          },
          sections: [{
            id: 'shell',
            title: 'Shell',
            rows: [{
              id: 'show-hints',
              label: 'Show hints',
              checked: true,
              kind: 'toggle',
            }],
          }],
        }),
      });

      let [model] = app.init();
      [model] = app.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, model);
      const surface = normalizeViewOutput(app.view(model), {
        width: 80,
        height: 24,
      }).surface;

      const hasBg = Array.from({ length: surface.height }, (_, y) =>
        Array.from({ length: surface.width }, (_, x) => colorHex(surface.get(x, y).bg)).includes('#102938'),
      ).some(Boolean);
      const hasAccent = Array.from({ length: surface.height }, (_, y) =>
        Array.from({ length: surface.width }, (_, x) => colorHex(surface.get(x, y).fg)).includes('#ff66cc'),
      ).some(Boolean);

      expect(colorHex(surface.get(0, 0).fg)).toBe('#335577');
      expect(hasBg).toBe(true);
      expect(hasAccent).toBe(true);
    });
  it('opens a quit-confirm modal from the shell and quits on confirmation', async () => {
      const app = createFramedApp({
        pages: [makePage('home', 'Home', 'main')],
      });

      let [model] = app.init();
      let cmds: Cmd<FramedAppMsg<Msg>>[];
      [model, cmds] = app.update({ type: 'key', key: 'q', ctrl: false, alt: false, shift: false }, model);
      expect(model.quitConfirmOpen).toBe(true);
      expect(cmds).toHaveLength(0);

      [model, cmds] = app.update({ type: 'key', key: 'y', ctrl: false, alt: false, shift: false }, model);
      expect(model.quitConfirmOpen).toBe(false);
      expect(cmds).toHaveLength(1);

      const returned = await cmds[0]?.(ignoreFrameMsg, commandRuntime);
      expect(returned).toBe(QUIT);
    });
  it('accepts uppercase Y and N in the quit-confirm modal', async () => {
      const app = createFramedApp({
        pages: [makePage('home', 'Home', 'main')],
      });

      let [model] = app.init();
      let cmds: Cmd<FramedAppMsg<Msg>>[];

      [model, cmds] = app.update({ type: 'key', key: 'q', ctrl: false, alt: false, shift: false }, model);
      expect(model.quitConfirmOpen).toBe(true);
      expect(cmds).toHaveLength(0);

      [model, cmds] = app.update({ type: 'key', key: 'N', ctrl: false, alt: false, shift: true }, model);
      expect(model.quitConfirmOpen).toBe(false);
      expect(cmds).toHaveLength(0);

      [model, cmds] = app.update({ type: 'key', key: 'q', ctrl: false, alt: false, shift: false }, model);
      expect(model.quitConfirmOpen).toBe(true);
      expect(cmds).toHaveLength(0);

      [model, cmds] = app.update({ type: 'key', key: 'Y', ctrl: false, alt: false, shift: true }, model);
      expect(model.quitConfirmOpen).toBe(false);
      expect(cmds).toHaveLength(1);

      const returned = await cmds[0]?.(ignoreFrameMsg, commandRuntime);
      expect(returned).toBe(QUIT);
    });
});
