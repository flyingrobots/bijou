
import {
  afterEach,
  createDocsApp,
  createTestContext,
  describe,
  expect,
  frameText,
  it,
  KEY_ENTER,
  runScript,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

type DocsFrame = Parameters<typeof frameText>[0];

function last(frames: readonly DocsFrame[]): DocsFrame {
  const frame = frames.at(-1);
  if (frame == null) throw new Error('Missing frame');
  return frame;
}

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('opens a quit-confirm modal from the docs screen and dismisses it with n', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const opened = await runScript(app, [
      { key: KEY_ENTER },
      { key: 'q' },
    ], { ctx });
    expect((opened.model).docsModel.quitConfirmOpen).toBe(true);
    expect(frameText(last(opened.frames))).toContain('Quit?');
    const dismissed = await runScript(app, [
      { key: KEY_ENTER },
      { key: 'q' },
      { key: 'n' },
    ], { ctx });
    expect((dismissed.model).docsModel.quitConfirmOpen).toBe(false);
  });
});
