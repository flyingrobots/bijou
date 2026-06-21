import { afterAll, beforeAll, createFramedApp, createTestContext, describe, describeFrameLayerStack, expect, it, makeModalPage, makePage, runScript, setDefaultContext, _resetDefaultContextForTesting } from './app-frame.test-support.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();
  beforeAll(() => { setDefaultContext(testCtx); });
  afterAll(() => { _resetDefaultContextForTesting(); });
  it('describes the active frame layer stack for shell surfaces and page modals', async () => {
      const shellApp = createFramedApp({
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
        enableCommandPalette: true,
      });

      let [shellModel] = shellApp.init();
      expect(describeFrameLayerStack(shellModel).map((layer) => layer.kind)).toEqual(['workspace']);

      [shellModel] = shellApp.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, shellModel);
      expect(describeFrameLayerStack(shellModel).map((layer) => layer.kind)).toEqual(['workspace', 'settings']);

      [shellModel] = shellApp.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, shellModel);
      expect(describeFrameLayerStack(shellModel).map((layer) => layer.kind)).toEqual(['workspace', 'settings', 'help']);

      [shellModel] = shellApp.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, shellModel);
      [shellModel] = shellApp.update({ type: 'key', key: '/', ctrl: false, alt: false, shift: false }, shellModel);
      expect(describeFrameLayerStack(shellModel).map((layer) => layer.kind)).toEqual(['workspace', 'settings', 'search']);

      [shellModel] = shellApp.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, shellModel);
      [shellModel] = shellApp.update({ type: 'key', key: 'q', ctrl: false, alt: false, shift: false }, shellModel);
      expect(describeFrameLayerStack(shellModel).map((layer) => layer.kind)).toEqual(['workspace', 'quit-confirm']);

      const modalApp = createFramedApp({
        pages: [makeModalPage('home', 'Home', 'main')],
      });

      const modalResult = await runScript(modalApp, [{ key: 'm' }]);
      const modalModel = modalResult.model;
      expect(describeFrameLayerStack(modalModel, { pageModalOpen: !!modalModel.pageModels.home?.modalOpen }).map((layer) => layer.kind)).toEqual([
        'workspace',
        'page-modal',
      ]);
    });
});
