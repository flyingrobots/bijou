
import {
  afterEach,
  createDocsApp,
  createTestContext,
  describe,
  docsPageModel,
  expect,
  frameText,
  it,
  KEY_ENTER,
  KEY_F2,
  keyMsg,
  normalizeViewOutput,
  parseKey,
  QUIT,
  runScript,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

import type { DocsApp } from './docs-preview-model-types.js';

import { isCmdCleanup } from '../packages/bijou-tui/src/types.js';

function runCommand(commands: ReturnType<DocsApp['update']>[1]) {
  const command = commands.at(0);
  if (command == null) throw new Error('Missing command');
  return command(() => { throw new Error('Unexpected emit'); }, { onPulse: () => ({ dispose: () => undefined }) });
}

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('opens the standard shell settings drawer with F2 and toggles visible DOGFOOD preferences', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const entered = await runScript(app, [{ key: KEY_ENTER }], { ctx });
    let model = entered.model;
    let updateResult = app.update(keyMsg('f2'), model);
    model = updateResult[0];
    const settingsFrame = normalizeViewOutput(app.view(model), {
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
    const commandResult = await runCommand(updateResult[1]);
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
    const secondCommandResult = await runCommand(updateResult[1]);
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
    for (const hint of ['? Help', '/ Search', 'F2 Settings', 'q Quit']) expect(footer).toContain(hint);
    for (const hint of ['↑/↓ browse', 'Enter open', ',/. cycle']) expect(footer).not.toContain(hint);
    expect(text).not.toContain('scroll: j/k • d/u • g/G • mouse wheel');

    const landingFrame = normalizeViewOutput(app.view({ ...model, route: 'landing' }), {
      width: ctx.runtime.columns,
      height: ctx.runtime.rows,
    }).surface;
    expect(frameText(landingFrame)).toContain('60 fps • quality');
  });
});

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

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
});
