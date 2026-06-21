import { afterAll, beforeAll, createFramedApp, createTestContext, ctrlKey, describe, expect, it, makePage, setDefaultContext, _resetDefaultContextForTesting } from './app-frame.test-support.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();
  beforeAll(() => { setDefaultContext(testCtx); });
  afterAll(() => { _resetDefaultContextForTesting(); });
  it('closes settings with escape without opening quit confirm', () => {
      const app = createFramedApp({
        pages: [makePage('home', 'Home', 'main')],
        settings: () => ({
          title: 'Settings',
          sections: [{
            id: 'shell',
            title: 'Shell',
            rows: [{
              id: 'show-hints',
              label: 'Show hints',
              valueLabel: 'On',
            }],
          }],
        }),
      });

      let [model] = app.init();
      [model] = app.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, model);
      expect(model.settingsOpen).toBe(true);

      [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);
      expect(model.settingsOpen).toBe(false);
      expect(model.quitConfirmOpen).toBe(false);
    });
  it('still opens quit confirm with q while settings are open', () => {
      const app = createFramedApp({
        pages: [makePage('home', 'Home', 'main')],
        settings: () => ({
          title: 'Settings',
          sections: [{
            id: 'shell',
            title: 'Shell',
            rows: [{
              id: 'show-hints',
              label: 'Show hints',
              valueLabel: 'On',
            }],
          }],
        }),
      });

      let [model] = app.init();
      [model] = app.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, model);
      expect(model.settingsOpen).toBe(true);

      [model] = app.update({ type: 'key', key: 'q', ctrl: false, alt: false, shift: false }, model);
      expect(model.settingsOpen).toBe(false);
      expect(model.quitConfirmOpen).toBe(true);
    });
  it('closes the command palette with escape without opening quit confirm', () => {
      const app = createFramedApp({
        pages: [makePage('home', 'Home', 'main')],
        enableCommandPalette: true,
      });

      let [model] = app.init();
      [model] = app.update(ctrlKey('p'), model);
      expect(model.commandPalette).toBeDefined();

      [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);
      expect(model.commandPalette).toBeUndefined();
      expect(model.quitConfirmOpen).toBe(false);
    });
  it('dismisses topmost layers before opening quit confirm', () => {
      const app = createFramedApp({
        pages: [makePage('home', 'Home', 'main')],
        settings: () => ({
          title: 'Settings',
          sections: [{
            id: 'shell',
            title: 'Shell',
            rows: [{
              id: 'show-hints',
              label: 'Show hints',
              valueLabel: 'On',
            }],
          }],
        }),
      });

      let [model] = app.init();
      [model] = app.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, model);
      [model] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
      expect(model.settingsOpen).toBe(true);
      expect(model.helpOpen).toBe(true);

      [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);
      expect(model.helpOpen).toBe(false);
      expect(model.settingsOpen).toBe(true);
      expect(model.quitConfirmOpen).toBe(false);

      [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);
      expect(model.settingsOpen).toBe(false);
      expect(model.quitConfirmOpen).toBe(false);

      [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);
      expect(model.quitConfirmOpen).toBe(true);
    });
});
