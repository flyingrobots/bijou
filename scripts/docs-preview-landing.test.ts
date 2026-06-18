import {
  activeDocsPageModel,
  afterEach,
  assertReadableDogfoodTheme,
  BIJOU_DARK,
  BIJOU_LIGHT,
  colorHex,
  createDocsApp,
  createTestContext,
  describe,
  docsShellThemesForTesting,
  expectedBijouLogoYOffset,
  expectedBijouSvgOverlay,
  expectedStackedWakeChar,
  expect,
  frameText,
  it,
  KEY_BACKTICK,
  KEY_DOWN,
  KEY_ENTER,
  KEY_F10,
  KEY_LEFT,
  KEY_RIGHT,
  KEY_UP,
  keyMsg,
  matchingBijouSvgOverlayGlyphCount,
  bijouSvgOverlayMetrics,
  normalizeViewOutput,
  QUIT,
  runScript,
  serializeFrame,
  stackedWakeRowCount,
  titleBackgroundGlyphCount,
  V7_DEFAULT_BACKGROUND,
  V7_RASTER_TITLE_GLYPHS,
  _resetDefaultContextForTesting,
  Theme,
} from './docs-preview.test-support.js';
import { must } from '@flyingrobots/bijou/adapters/test';

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('opens landing quit confirm with escape and quits on confirmation', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    let [model] = app.init();
    let cmds: any[] = [];

    [model, cmds] = app.update(keyMsg('escape'), model);
    expect((model).landingQuitConfirmOpen).toBe(true);
    expect(cmds).toHaveLength(0);

    [model, cmds] = app.update(keyMsg('y'), model);
    expect((model).landingQuitConfirmOpen).toBe(false);
    expect(cmds).toHaveLength(1);

    const returned = await cmds[0]?.(() => {}, {
      onPulse() {
        return { dispose() {} };
      },
    });
    expect(returned).toBe(QUIT);
  });

  it('dismisses the landing quit confirm with n', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    let [model] = app.init();
    [model] = app.update(keyMsg('escape'), model);
    expect((model).landingQuitConfirmOpen).toBe(true);

    [model] = app.update(keyMsg('n'), model);
    expect((model).landingQuitConfirmOpen).toBe(false);
  });

  it('quits immediately from the landing screen in pipe mode', async () => {
    const ctx = createTestContext({ mode: 'pipe', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const [model] = app.init();
    const [, cmds] = app.update(keyMsg('escape'), model);
    expect(cmds).toHaveLength(1);

    const returned = await cmds[0]?.(() => {}, {
      onPulse() {
        return { dispose() {} };
      },
    });
    expect(returned).toBe(QUIT);
  });

  it('animates the landing title screen on pulse', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const pulsed = await runScript(app, [{ pulse: { dt: 0.35 } }], { ctx });

    expect((pulsed.model).route).toBe('landing');
    expect(serializeFrame(must(initial.frames[0]))).not.toEqual(serializeFrame(must(pulsed.frames[pulsed.frames.length - 1])));
  });

  it('renders a stacked sine-wave V7 title wake with the Bijou SVG overlay', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const pulsed = await runScript(app, [{ pulse: { dt: 0.35 } }], { ctx });

    const initialText = frameText(must(initial.frames[0]));
    const pulsedText = frameText(must(pulsed.frames[pulsed.frames.length - 1]));

    expect(titleBackgroundGlyphCount(initialText)).toBeGreaterThan(1000);
    expect(titleBackgroundGlyphCount(pulsedText)).toBeGreaterThan(1000);
    expect(stackedWakeRowCount(must(initial.frames[0]))).toBeGreaterThan(12);
    expect(stackedWakeRowCount(must(pulsed.frames[pulsed.frames.length - 1]))).toBeGreaterThan(12);
    const overlay = matchingBijouSvgOverlayGlyphCount(must(initial.frames[0]), 0);
    expect(overlay.expected).toBeGreaterThan(450);
    expect(overlay.matched).toBeGreaterThan(Math.floor(overlay.expected * 0.85));
    const metrics = bijouSvgOverlayMetrics(initial.frames[0]?.width, initial.frames[0]?.height);
    let sameColorWakeCells = 0;
    for (let y = 0; y < initial.frames[0]?.height; y++) {
      for (let x = 0; x < initial.frames[0]?.width; x++) {
        if (
          x >= metrics.left
          && x < metrics.left + metrics.columns
          && y >= metrics.top
          && y < metrics.top + metrics.rows
        ) {
          continue;
        }
        const cell = initial.frames[0]?.get(x, y);
        if (!V7_RASTER_TITLE_GLYPHS.has(cell.char ?? '')) continue;
        if (colorHex(cell.bg) === V7_DEFAULT_BACKGROUND) continue;
        if (colorHex(cell.fg) !== colorHex(cell.bg)) continue;
        sameColorWakeCells++;
      }
    }
    expect(sameColorWakeCells).toBeGreaterThan(400);
    expect(serializeFrame(must(initial.frames[0]))).not.toEqual(serializeFrame(must(pulsed.frames[pulsed.frames.length - 1])));
  });

  it('uses the Bijou SVG as a transparent-background title mask', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const frame = must(initial.frames[0]);
    const overlay = expectedBijouSvgOverlay(frame.width, frame.height);
    const paintedPathCell = { x: overlay.left, y: overlay.top };
    const transparentMaskCell = { x: overlay.left + 15, y: overlay.top };

    expect(overlay.mask.get(0, 0).char).toBe('▓');
    expect(overlay.mask.get(15, 0).char).toBe(' ');
    expect(frame.get(paintedPathCell.x, paintedPathCell.y).char).toBe(overlay.mask.get(0, 0).char);
    expect(frame.get(transparentMaskCell.x, transparentMaskCell.y).char).toBe(
      expectedStackedWakeChar(transparentMaskCell.x, transparentMaskCell.y, frame.width),
    );
    expect(colorHex(frame.get(paintedPathCell.x, paintedPathCell.y).fg)).not.toBeNull();
    expect(colorHex(frame.get(transparentMaskCell.x, transparentMaskCell.y).fg)).not.toBeNull();
  });

  it('animates the Bijou SVG title mask with staggered row and fill waves', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40, refreshRate: 60 } });
    const app = createDocsApp(ctx);
    const pulseMs = 352;

    const initial = await runScript(app, [], { ctx });
    const pulsed = await runScript(app, [{ pulse: { dt: pulseMs / 1000 } }], { ctx });
    const initialFrame = must(initial.frames[0]);
    const pulsedFrame = must(pulsed.frames.at(-1));
    const overlay = expectedBijouSvgOverlay(initialFrame.width, initialFrame.height);
    const sampleX = 0;
    const sampleY = 0;
    const expectedChar = overlay.mask.get(sampleX, sampleY).char;
    const initialY = overlay.top + expectedBijouLogoYOffset(sampleX, overlay.mask.width, 0);
    const pulsedY = overlay.top + expectedBijouLogoYOffset(sampleX, overlay.mask.width, pulseMs);

    expect(expectedChar).not.toBe(' ');
    expect(initialY).not.toBe(pulsedY);
    expect(initialFrame.get(overlay.left + sampleX, initialY).char).toBe(expectedChar);
    expect(pulsedFrame.get(overlay.left + sampleX, pulsedY).char).toBe(expectedChar);
    expect(colorHex(initialFrame.get(overlay.left + sampleX, initialY).fg)).not.toBe(
      colorHex(pulsedFrame.get(overlay.left + sampleX, pulsedY).fg),
    );
  });

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

  it('updates the landing refresh-rate readout from pulse cadence', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const pulsed = await runScript(app, [{ pulse: { dt: 1 / 30 } }], { ctx });

    expect((pulsed.model).landingFps).toBe(54);
    const footer = frameText(must(pulsed.frames[pulsed.frames.length - 1])).split('\n')[pulsed.frames[pulsed.frames.length - 1]?.height - 1] ?? '';
    expect(footer).toContain('54 fps • auto/full');
  });

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

  it('ships one DogFood shell theme family with readable dark and light modes', () => {
    const shellThemes = docsShellThemesForTesting();
    const dogfood = shellThemes.find((theme) => theme.id === 'dogfood');
    const dark = dogfood?.modes?.find((mode) => mode.id === 'dark');
    const light = dogfood?.modes?.find((mode) => mode.id === 'light');

    expect(shellThemes[0]?.id).toBe('dogfood');
    expect(dogfood?.label).toBe('DOGFOOD');
    expect(dark?.label).toBe('Dark');
    expect(light?.label).toBe('Light');
    expect(dark?.theme.name).toBe('dogfood-dark');
    expect(light?.theme.name).toBe('dogfood-light');

    assertReadableDogfoodTheme(must(dark).theme);
    assertReadableDogfoodTheme(must(light).theme);

    expect(dark?.theme.semantic.primary.hex).toBe(BIJOU_DARK.semantic.primary.hex);
    expect(dark?.theme.surface.primary.bg).toBe(BIJOU_DARK.surface.primary.bg);
    expect(light?.theme.semantic.primary.hex).toBe(BIJOU_LIGHT.semantic.primary.hex);
    expect(light?.theme.surface.primary.bg).toBe(BIJOU_LIGHT.surface.primary.bg);
    expect(dark?.theme.semantic.primary.hex).not.toBe(dark?.theme.semantic.accent.hex);
    expect(dark?.theme.ui.cursor.hex).not.toBe(dark?.theme.status.info.hex);
    expect(light?.theme.semantic.primary.hex).not.toBe(light?.theme.semantic.accent.hex);
    expect(light?.theme.ui.cursor.hex).not.toBe(light?.theme.status.info.hex);
  });

  it('opens the Theme Inspector drawer with F10 and keeps it bounded', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 140, rows: 42 } });
    const app = createDocsApp(ctx);

    const opened = await runScript(app, [{ key: KEY_ENTER }, { key: KEY_F10 }], { ctx });
    const openedText = frameText(must(opened.frames.at(-1)));

    expect((opened.model).route).toBe('docs');
    expect((opened.model).themeInspectorOpen).toBe(true);
    expect(openedText).toContain('Theme Inspector');
    expect(openedText).toContain('Active: DOGFOOD / Dark');
    expect(openedText).toContain('semantic.primary');
    expect(openedText).toContain('surface.primary');
    expect(openedText).toContain('safe pairs pass');
    const closed = await runScript(app, [{ key: KEY_ENTER }, { key: KEY_F10 }, { key: KEY_F10 }], { ctx });
    expect((closed.model).themeInspectorOpen).toBe(false);
    expect(frameText(must(closed.frames.at(-1)))).not.toContain('Theme Inspector');
  });
  it('keeps the Theme Inspector drawer inside narrow terminal bounds', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 30, rows: 18 } });
    const app = createDocsApp(ctx);
    const opened = await runScript(app, [{ key: KEY_ENTER }, { key: KEY_F10 }], { ctx });
    const frame = must(opened.frames.at(-1));
    expect((opened.model).themeInspectorOpen).toBe(true);
    expect(frame.width).toBe(30);
    expect(frame.height).toBe(18);
    expect(frameText(frame)).toContain('Theme Inspector');
  });
  it('lets q open the normal quit confirmation while the Theme Inspector is open', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 140, rows: 42 } });
    const app = createDocsApp(ctx);
    const opened = await runScript(app, [{ key: KEY_ENTER }, { key: KEY_F10 }, { key: 'q' }], { ctx });
    expect((opened.model).themeInspectorOpen).toBe(false);
    expect((opened.model).docsModel.quitConfirmOpen).toBe(true);
    expect(frameText(must(opened.frames.at(-1)))).toContain('Quit?');
  });
  it('scrolls the Theme Inspector drawer without closing it', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 118, rows: 20 } });
    const app = createDocsApp(ctx);
    const scrolled = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_F10 },
      { key: KEY_DOWN },
      { key: KEY_DOWN },
    ], { ctx });
    expect((scrolled.model).themeInspectorOpen).toBe(true);
    expect((scrolled.model).themeInspectorScrollY).toBeGreaterThan(0);
    expect(frameText(must(scrolled.frames.at(-1)))).toContain('Theme Inspector');
    const restored = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_F10 },
      { key: KEY_DOWN },
      { key: KEY_DOWN },
      { key: KEY_UP },
    ], { ctx });
    expect((restored.model).themeInspectorOpen).toBe(true);
    expect((restored.model).themeInspectorScrollY).toBeLessThan((scrolled.model).themeInspectorScrollY);
  });
  it('publishes the Theme Lab page with default palettes and shell gallery facts', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 44 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      initialPageId: 'themes',
    });
    const result = await runScript(app, [], { ctx });
    const text = frameText(must(result.frames.at(-1)));
    expect((result.model).docsModel.activePageId).toBe('themes');
    expect(text).toContain('Theme Lab');
    expect(text).toContain('Default dark preset: bijou-dark');
    expect(text).toContain('Default light preset: bijou-light');
    expect(text).toContain('Color reuse: dark');
    expect(text).toContain('DOGFOOD / Dark -> dogfood-dark');
    expect(text).toContain('bijou-dark token swatches');
    expect(text).toContain('semantic.primary');
    expect(text).toContain('gradient.brand');
  });
});
