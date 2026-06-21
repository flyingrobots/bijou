
import {
  activeDocsPageModel,
  afterEach,
  createDocsApp,
  createTestContext,
  describe,
  expect,
  frameText,
  it,
  KEY_BACKTICK,
  KEY_LEFT,
  KEY_RIGHT,
  normalizeViewOutput,
  runScript,
  serializeFrame,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('reuses giant landing frames across small pulses within the same quality bucket', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 400, rows: 120, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const tinyPulse = await runScript(app, [{ pulse: { dt: 1 / 60 } }], { ctx });
    const steppedPulse = await runScript(app, [{ pulse: { dt: 0.12 } }], { ctx });

    expect(serializeFrame(must(initial.frames[0]))).toEqual(serializeFrame(must(tinyPulse.frames[tinyPulse.frames.length - 1])));
    expect(serializeFrame(must(initial.frames[0]))).not.toEqual(serializeFrame(must(steppedPulse.frames[steppedPulse.frames.length - 1])));
    const footer = frameText(must(initial.frames[0])).split('\n')[initial.frames[0]?.height - 1] ?? '';
    expect(footer).toContain('60 fps • auto/performance');
  });
});

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('updates the landing refresh-rate readout from pulse cadence', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const pulsed = await runScript(app, [{ pulse: { dt: 1 / 30 } }], { ctx });

    expect((pulsed.model).landingFps).toBe(54);
    const footer = frameText(must(pulsed.frames[pulsed.frames.length - 1])).split('\n')[pulsed.frames[pulsed.frames.length - 1]?.height - 1] ?? '';
    expect(footer).toContain('54 fps • auto/full');
  });
});

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('toggles the perf HUD on the landing title without entering docs', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const opened = await runScript(app, [{ key: KEY_BACKTICK }], { ctx });
    expect((opened.model).route).toBe('landing');
    expect((opened.model).docsModel.perfHudOpen).toBe(true);
    const openedText = frameText(must(opened.frames.at(-1)));
    expect(openedText).toContain('Perf HUD');
    expect(openedText).toContain('view');
    expect(openedText).toContain('diff');

    const timedModel = opened.model;
    const timedFrame = normalizeViewOutput(app.view({
      ...timedModel,
      docsModel: {
        ...timedModel.docsModel,
        frameTimeMs: 12.34,
        viewTimeMs: 4.56,
        diffTimeMs: 7.89,
      },
    }), { width: ctx.runtime.columns, height: ctx.runtime.rows }).surface;
    const timedText = frameText(timedFrame);
    expect(timedText).toContain('frame 12.34 ms');
    expect(timedText).toContain('view  4.56 ms');
    expect(timedText).toContain('diff  7.89 ms');
    expect(timedText).not.toContain('frame 0.00 ms');

    const closed = await runScript(app, [{ key: KEY_BACKTICK }, { key: KEY_BACKTICK }], { ctx });
    expect((closed.model).route).toBe('landing');
    expect((closed.model).docsModel.perfHudOpen).toBe(false);
    expect(frameText(must(closed.frames.at(-1)))).not.toContain('Perf HUD');
  });
});

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('switches landing-screen themes with number keys and arrow cycling', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const numbered = await runScript(app, [{ key: '3' }], { ctx });
    const cycledRight = await runScript(app, [{ key: KEY_RIGHT }], { ctx });
    const cycledLeft = await runScript(app, [{ key: KEY_LEFT }], { ctx });

    expect((numbered.model).landingThemeIndex).toBe(2);
    expect(activeDocsPageModel(numbered.model).landingThemeIndex).toBe(2);
    expect((cycledRight.model).landingThemeIndex).toBe(1);
    expect(activeDocsPageModel(cycledRight.model).landingThemeIndex).toBe(1);
    expect((cycledLeft.model).landingThemeIndex).toBe(5);
    expect(activeDocsPageModel(cycledLeft.model).landingThemeIndex).toBe(5);
    expect((cycledLeft.model).docsModel.activeShellThemeId).toBe('verdant-plum');

    expect(serializeFrame(must(initial.frames[0]))).not.toEqual(serializeFrame(must(numbered.frames[numbered.frames.length - 1])));
    expect(serializeFrame(must(initial.frames[0]))).not.toEqual(serializeFrame(must(cycledRight.frames[cycledRight.frames.length - 1])));
  });
});
