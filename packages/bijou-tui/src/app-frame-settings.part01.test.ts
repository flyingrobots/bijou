import { afterAll, beforeAll, createFramedApp, createTestContext, describe, expect, it, makePage, normalizeViewOutput, setDefaultContext, shiftKey, surfaceToString, _resetDefaultContextForTesting } from './app-frame.test-support.js';
import { createFrenchNotificationCenter } from './app-frame-settings.test-support.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();
  beforeAll(() => { setDefaultContext(testCtx); });
  afterAll(() => { _resetDefaultContextForTesting(); });
  it('localizes shell help groups and notification-center review copy', () => {
      const { runtime, notificationCenter } = createFrenchNotificationCenter();

      const app = createFramedApp({
        i18n: runtime,
        pages: [makePage('home', 'Home', 'main')],
        notificationCenter,
      });

      let [model] = app.init();
      [model] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
      let rendered = surfaceToString(
        normalizeViewOutput(app.view(model), { width: 90, height: 24 }).surface,
        testCtx.style,
      );
      expect(rendered).toContain('Cadre');
      expect(rendered).toContain('Basculer l’aide');

      [model] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
      [model] = app.update(shiftKey('n'), model);
      rendered = surfaceToString(
        normalizeViewOutput(app.view(model), { width: 90, height: 24 }).surface,
        testCtx.style,
      );
      expect(rendered).toContain('Actives : 1');
      expect(rendered).toContain('Archivées');
      expect(rendered).toContain('Filtre : Toutes');
      expect(rendered).toContain('Pile actuelle');
      expect(rendered).toContain('Historique • Toutes • 1-1');
      expect(rendered).toContain('sur 1');
      expect(rendered).toContain('Action : Retry');
    });
});
