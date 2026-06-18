import {
  afterEach,
  COMPONENT_STORIES,
  createDocsApp,
  createTestContext,
  describe,
  docsPageModel,
  expect,
  frameText,
  it,
  KEY_DOWN,
  KEY_ENTER,
  KEY_F2,
  KEY_NEXT_TAB,
  KEY_TAB,
  keyMsg,
  normalizeViewOutput,
  parseKey,
  QUIT,
  resolveDogfoodDocsCoverage,
  runScript,
  serializeFrame,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';
import { isCmdCleanup } from '../packages/bijou-tui/src/types.js';

describe('docs preview app', () => {
  afterEach(() => _resetDefaultContextForTesting());

  it('opens the standard shell settings drawer with F2 and toggles visible DOGFOOD preferences', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const entered = await runScript(app, [{ key: KEY_ENTER }], { ctx });
    let model = entered.model;
    let updateResult = app.update(keyMsg('f2'), model);
    model = updateResult[0];
    let settingsFrame = normalizeViewOutput(app.view(model), {
      width: ctx.runtime.columns,
      height: ctx.runtime.rows,
    }).surface;
    expect(frameText(settingsFrame)).toContain('☑ On');
    expect(frameText(settingsFrame)).toContain('Show active-pane control');
    expect(frameText(settingsFrame)).toContain('cues in the footer');
    expect(frameText(settingsFrame)).toContain('↻ Shell theme');
    expect(frameText(settingsFrame)).toContain('DOGFOOD / Dark');
    expect(frameText(settingsFrame)).not.toContain('Landing theme');
    expect(frameText(settingsFrame)).toContain('Localization');
    expect(frameText(settingsFrame)).toContain('Preferred language');
    expect(frameText(settingsFrame)).toContain('Current language: English');
    expect(frameText(settingsFrame)).toContain('Landing');
    expect(frameText(settingsFrame)).toContain('Adapts render cost to');
    expect(frameText(settingsFrame)).toContain('Options:');
    expect(frameText(settingsFrame)).toContain('Auto, Quality, Balanced');
    expect(frameText(settingsFrame)).toContain('↻ Landing quality');
    expect(frameText(settingsFrame)).toContain('Auto (ful');
    updateResult = app.update(keyMsg('enter'), model);
    model = updateResult[0];
    const commandResult = await updateResult[1][0]!(() => {}, {
      onPulse() {
        return { dispose() {} };
      },
    });
    if (commandResult !== undefined && commandResult !== QUIT && !isCmdCleanup(commandResult)) {
      model = app.update(commandResult, model)[0];
    }
    let frame = normalizeViewOutput(app.view(model), {
      width: ctx.runtime.columns,
      height: ctx.runtime.rows,
    }).surface;
    expect(model.docsModel.runtimeNotifications.items[0]?.message).toBe('Show hints turned off.');
    expect(frameText(frame)).toContain('notices:1');
    updateResult = app.update(keyMsg('down'), model);
    model = updateResult[0];
    updateResult = app.update(keyMsg('down'), model);
    model = updateResult[0];
    updateResult = app.update(keyMsg('down'), model);
    model = updateResult[0];
    updateResult = app.update(keyMsg('enter'), model);
    model = updateResult[0];
    const secondCommandResult = await updateResult[1][0]!(() => {}, {
      onPulse() {
        return { dispose() {} };
      },
    });
    if (secondCommandResult !== undefined && secondCommandResult !== QUIT && !isCmdCleanup(secondCommandResult)) {
      model = app.update(secondCommandResult, model)[0];
    }
    updateResult = app.update(keyMsg('f2'), model);
    model = updateResult[0];

    frame = normalizeViewOutput(app.view(model), {
      width: ctx.runtime.columns,
      height: ctx.runtime.rows,
    }).surface;
    const text = frameText(frame);
    const footer = text.split('\n')[frame.height - 1] ?? '';
    const pageModel = docsPageModel(model, 'guides');
    expect(model.docsModel.settingsOpen).toBe(false);
    expect(pageModel.showHints).toBe(false);
    expect(pageModel.landingQualityMode).toBe('quality');
    expect(footer).toContain('? Help');
    expect(footer).toContain('/ Search');
    expect(footer).toContain('F2 Settings');
    expect(footer).toContain('q Quit');
    expect(footer).not.toContain('↑/↓ browse');
    expect(footer).not.toContain('Enter open');
    expect(footer).not.toContain(',/. cycle');
    expect(text).not.toContain('scroll: j/k • d/u • g/G • mouse wheel');

    const landingFrame = normalizeViewOutput(app.view({ ...model, route: 'landing' }), {
      width: ctx.runtime.columns,
      height: ctx.runtime.rows,
    }).surface;
    expect(frameText(landingFrame)).toContain('60 fps • quality');
  });

  it('keeps landing F2 on the title screen because only Enter continues', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    let [model] = app.init();
    [model] = app.update(parseKey(KEY_F2), model);
    expect((model).route).toBe('landing');
    expect((model).docsModel.settingsOpen).toBe(false);
    expect((model).docsModel.quitConfirmOpen).toBe(false);

    [model] = app.update(parseKey(KEY_ENTER), model);
    expect((model).route).toBe('docs');
    expect((model).docsModel.quitConfirmOpen).toBe(false);
  });

  it('shows accordion-style family headers without the oversized custom help strip', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 40 } });
    const app = createDocsApp(ctx);

    const entered = await runScript(app, [{ key: KEY_ENTER }, { key: KEY_NEXT_TAB }], { ctx });
    const frame = entered.frames[entered.frames.length - 1]!;

    let text = '';
    for (let y = 0; y < frame.height; y++) {
      for (let x = 0; x < frame.width; x++) {
        text += frame.get(x, y).char || ' ';
      }
      text += '\n';
    }

    const lines = text.split('\n');
    expect(text).toContain('Status and in-flow');
    expect(lines[0]).toContain('Bijou Docs');
    expect(lines[frame.height - 1]).toContain('? Help');
    expect(lines[frame.height - 1]).toContain('/ Search');
    expect(lines[frame.height - 1]).toContain('F2 Settings');
    expect(lines[frame.height - 1]).toContain('Tab next pane');
    expect(lines[frame.height - 1]).toContain('↑/↓ browse');
    expect(lines[frame.height - 1]).toContain('Enter open');
    expect(lines.slice(0, frame.height - 1).join('\n')).not.toContain('↑/↓ browse • Enter open • Tab next pane');
  });

  it('keeps family scrolling anchored until the real viewport height is exhausted', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: KEY_ENTER },
      ...Array.from({ length: 14 }, () => ({ key: KEY_DOWN })),
    ], { ctx });

    const pageModel = docsPageModel(result.model, 'components');

    expect(pageModel.familyState.height).toBeGreaterThan(14);
    expect(pageModel.familyState.focusIndex).toBe(14);
    expect(pageModel.familyState.scrollY).toBe(0);
  });

  it('renders the family pane through a viewport-backed scrollbar when it overflows', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 16 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [{ key: KEY_ENTER }, { key: KEY_NEXT_TAB }], { ctx });
    const frame = result.frames.at(-1)!;
    const pageModel = docsPageModel(result.model, 'components');
    const leftPaneText = frameText(frame)
      .split('\n')
      .slice(0, -1)
      .map((line) => line.slice(0, 34))
      .join('\n');

    expect(pageModel.familyState.items.length).toBeGreaterThan(pageModel.familyState.height);
    expect(leftPaneText).toMatch(/[█│]/);
  });

  it('shows a Bijou introduction and docs guide when no component is selected', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 40 } });
    const app = createDocsApp(ctx);
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    const entered = await runScript(app, [{ key: KEY_ENTER }, { key: KEY_NEXT_TAB }], { ctx });
    const frame = entered.frames[entered.frames.length - 1]!;
    const lines = frameText(frame).split('\n');
    const text = lines.join('\n');

    expect(text).toContain('What is Bijou?');
    expect(text).toContain('How to use these docs');
    expect(text).toContain('Documentation coverage');
    expect(text).toContain(`${coverage.documentedFamilies}/${coverage.totalFamilies}`);
    expect(text).toContain(`${coverage.percent}%`);
    expect(text).toContain('/ to search');
    expect(text).toContain('F2 for settings');
    expect(text).toContain('surface-native terminal UI framework');
  });

  it('keeps static progress previews stable while looping previews animate on pulse', async () => {
    const openDocs = [{ key: KEY_ENTER }, { key: KEY_NEXT_TAB }] as const;
    const openProgressStory = [{ msg: { type: 'docs', msg: { type: 'select-story', storyId: 'progress-bar' } } }] as const;
    const chooseLoopingVariant = [{ msg: { type: 'docs', msg: { type: 'select-variant', index: 1 } } }] as const;
    const pulse = [{ pulse: { dt: 0.45 } }] as const;

    async function renderFrame(steps: readonly any[]) {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
      const app = createDocsApp(ctx);
      const result = await runScript(app, [...steps], { ctx, pulseFps: false });
      const frame = result.frames.at(-1)!;
      return {
        text: frameText(frame),
        serialized: serializeFrame(frame),
      };
    }

    const staticBase = await renderFrame([...openDocs, ...openProgressStory]);
    const staticPulsed = await renderFrame([...openDocs, ...openProgressStory, ...pulse]);

    expect(staticBase.text).toContain('progressBar()');
    expect(staticBase.serialized).toEqual(staticPulsed.serialized);

    const loopingBase = await renderFrame([...openDocs, ...openProgressStory, ...chooseLoopingVariant]);
    const loopingPulsed = await renderFrame([...openDocs, ...openProgressStory, ...chooseLoopingVariant, ...pulse]);

    expect(loopingBase.text).toContain('Looping rollout');
    expect(loopingBase.serialized).not.toEqual(loopingPulsed.serialized);
  });

  it('routes arrow keys to the focused docs pane instead of always driving the family nav', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: KEY_ENTER },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
      { key: KEY_TAB },
      { key: KEY_DOWN },
      { key: KEY_TAB },
      { key: KEY_DOWN },
    ], { ctx });

    const pageModel = docsPageModel(result.model, 'components');
    expect(pageModel.familyState.items[pageModel.familyState.focusIndex]?.value).toBe('story:alert');
    expect(pageModel.variantIndexByStory.alert).toBe(1);
    expect((result.model).docsModel.focusedPaneByPage.components).toBe('story-variants');
  });

  it('updates the footer hints to match the focused pane instead of leaving stale family controls visible', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: KEY_ENTER },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
      { key: KEY_TAB },
      { key: KEY_TAB, delay: 350 },
    ], { ctx });

    const frame = result.frames[result.frames.length - 1]!;
    const footer = frameText(frame).split('\n')[frame.height - 1] ?? '';

    expect((result.model).docsModel.focusedPaneByPage.components).toBe('story-variants');
    expect(footer).toContain('Tab next pane');
    expect(footer).toContain('↑/↓ variant');
    expect(footer).toContain(',/. cycle');
    expect(footer).toContain('1-4 profiles');
    expect(footer).not.toContain('Enter open');
    expect(footer).not.toContain('←/→ collapse/expand');
  });

  it('opens a quit-confirm modal from the docs screen and dismisses it with n', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const opened = await runScript(app, [
      { key: KEY_ENTER },
      { key: 'q' },
    ], { ctx });
    expect((opened.model).docsModel.quitConfirmOpen).toBe(true);
    expect(frameText(opened.frames[opened.frames.length - 1]!)).toContain('Quit?');

    const dismissed = await runScript(app, [
      { key: KEY_ENTER },
      { key: 'q' },
      { key: 'n' },
    ], { ctx });
    expect((dismissed.model).docsModel.quitConfirmOpen).toBe(false);
  });
});
