import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { createDocsApp, DOGFOOD_I18N_CATALOG, FRAME_I18N_CATALOG } from '../examples/docs/app.js';
import { resolveDogfoodDocsCoverage } from '../examples/docs/coverage.js';
import { COMPONENT_STORIES } from '../examples/docs/stories.js';
import { pseudoLocalize } from '../packages/bijou-i18n-tools/src/index.js';
import { QUIT } from '../packages/bijou-tui/src/types.js';
import { normalizeViewOutput } from '../packages/bijou-tui/src/view-output.js';

const KEY_ENTER = '\r';
const KEY_DOWN = '\x1b[B';
const KEY_LEFT = '\x1b[D';
const KEY_RIGHT = '\x1b[C';
const KEY_ESCAPE = '\x1b';
const KEY_TAB = '\t';
const KEY_CTRL_P = '\x10';

function keyMsg(key: string, options: { ctrl?: boolean; alt?: boolean; shift?: boolean } = {}) {
  return {
    type: 'key' as const,
    key,
    ctrl: options.ctrl ?? false,
    alt: options.alt ?? false,
    shift: options.shift ?? false,
  };
}

function serializeFrame(frame: { width: number; height: number; get(x: number, y: number): { char?: string; fg?: string; bg?: string } }) {
  const cells: string[] = [];
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const cell = frame.get(x, y);
      cells.push(`${cell.char ?? ' '}|${cell.fg ?? ''}|${cell.bg ?? ''}`);
    }
  }
  return cells.join('\n');
}

function frameText(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }) {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char || ' ';
    }
    text += '\n';
  }
  return text;
}

function withLocaleValues(
  catalog: {
    namespace: string;
    entries: readonly {
      key: { namespace: string; id: string };
      kind: 'message' | 'resource' | 'data';
      sourceLocale: string;
      values: Readonly<Record<string, unknown>>;
      fallbackValue?: unknown;
    }[];
  },
  locale: string,
  translate: (value: string, key: string) => string,
) {
  return {
    namespace: catalog.namespace,
    entries: catalog.entries.map((entry) => ({
      ...entry,
      values: Object.fromEntries(
        Object.entries(entry.values).map(([lang, value]) => {
          if (lang !== entry.sourceLocale || typeof value !== 'string') {
            return [lang, value];
          }
          return [lang, value];
        }).concat(
          Object.entries(entry.values)
            .filter(([lang, value]) => lang === entry.sourceLocale && typeof value === 'string')
            .map(([, value]) => [locale, translate(value as string, entry.key.id)]),
        ),
      ),
    })),
  };
}

describe('docs preview app', () => {
  it('uses the live local runtime entrypoint instead of the packaged build', () => {
    const source = readFileSync(new URL('../examples/docs/main.ts', import.meta.url), 'utf8');

    expect(source).toContain("../../packages/bijou-node/src/index.js");
    expect(source).toContain("../../packages/bijou-tui/src/index.js");
    expect(source).toMatch(/await run\(createDocsApp\(ctx\), \{ ctx, mouse: true \}\);/);
  });

  it('lands on the hero page first and enters the docs on Enter', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    expect((initial.model as any).route).toBe('landing');

    const entered = await runScript(app, [{ key: KEY_ENTER }], { ctx });
    expect((entered.model as any).route).toBe('docs');
  });

  it('renders the landing page with the animated title treatment and minimal entry copy', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 200, rows: 60, refreshRate: 73 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const frame = initial.frames[0]!;

    let text = '';
    for (let y = 0; y < frame.height; y++) {
      for (let x = 0; x < frame.width; x++) {
        text += frame.get(x, y).char || ' ';
      }
      text += '\n';
    }

    const lines = text.split('\n');
    const footer = lines[frame.height - 1] ?? '';

    expect(text).toContain('Press [Enter]');
    expect(footer).toContain('Esc/q quit');
    expect(footer).toContain('↑/↓ quality');
    expect(footer).toContain('←/→ theme');
    expect(footer).toContain('Enter continue');
    expect(footer).toContain('v4.0.0');
    expect(footer).toContain('73 fps • auto/full');
    expect(lines[0]).not.toContain('73 fps');
    expect(text).not.toContain('Documentation coverage');
    expect(text).toContain('DOGFOOD');
    expect(text).toContain('Documentation Of Good');
    expect(text).toContain('8""""');
    expect(text).not.toContain('What is Bijou?');
    expect(text).not.toContain('How to use these docs');
    expect(text).toMatch(/[█▓▒░·]/);
  });

  it('accepts localized shell and DOGFOOD catalogs for landing and onboarding copy', async () => {
    const locale = 'qps-ploc';
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 140, rows: 40, refreshRate: 60 } });
    const app = createDocsApp(ctx, {
      locale,
      direction: 'ltr',
      extraI18nCatalogs: [
        withLocaleValues(DOGFOOD_I18N_CATALOG, locale, (value) => pseudoLocalize(value)),
        withLocaleValues(FRAME_I18N_CATALOG, locale, (value) => pseudoLocalize(value)),
      ],
    });

    const landing = await runScript(app, [], { ctx });
    expect(frameText(landing.frames.at(-1)!)).toContain(pseudoLocalize('Press [Enter]'));

    const entered = await runScript(app, [{ key: KEY_ENTER }], { ctx });
    expect(frameText(entered.frames.at(-1)!)).toContain(pseudoLocalize('What is Bijou?'));
  });

  it('opens landing quit confirm with escape and quits on confirmation', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    let [model] = app.init();
    let cmds: any[] = [];

    [model, cmds] = app.update(keyMsg('escape'), model);
    expect((model as any).landingQuitConfirmOpen).toBe(true);
    expect(cmds).toHaveLength(0);

    [model, cmds] = app.update(keyMsg('y'), model);
    expect((model as any).landingQuitConfirmOpen).toBe(false);
    expect(cmds).toHaveLength(1);

    const returned = await cmds[0]!(() => {}, {
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
    expect((model as any).landingQuitConfirmOpen).toBe(true);

    [model] = app.update(keyMsg('n'), model);
    expect((model as any).landingQuitConfirmOpen).toBe(false);
  });

  it('quits immediately from the landing screen in pipe mode', async () => {
    const ctx = createTestContext({ mode: 'pipe', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const [model] = app.init();
    const [, cmds] = app.update(keyMsg('escape'), model);
    expect(cmds).toHaveLength(1);

    const returned = await cmds[0]!(() => {}, {
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

    expect((pulsed.model as any).route).toBe('landing');
    expect(serializeFrame(initial.frames[0]!)).not.toEqual(serializeFrame(pulsed.frames[pulsed.frames.length - 1]!));
  });

  it('reuses giant landing frames across small pulses within the same quality bucket', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 400, rows: 120, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const tinyPulse = await runScript(app, [{ pulse: { dt: 1 / 60 } }], { ctx });
    const steppedPulse = await runScript(app, [{ pulse: { dt: 0.12 } }], { ctx });

    expect(serializeFrame(initial.frames[0]!)).toEqual(serializeFrame(tinyPulse.frames[tinyPulse.frames.length - 1]!));
    expect(serializeFrame(initial.frames[0]!)).not.toEqual(serializeFrame(steppedPulse.frames[steppedPulse.frames.length - 1]!));
    const footer = frameText(initial.frames[0]!).split('\n')[initial.frames[0]!.height - 1] ?? '';
    expect(footer).toContain('60 fps • auto/performance');
  });

  it('updates the landing refresh-rate readout from pulse cadence', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const pulsed = await runScript(app, [{ pulse: { dt: 1 / 30 } }], { ctx });

    expect((pulsed.model as any).landingFps).toBe(54);
    const footer = frameText(pulsed.frames[pulsed.frames.length - 1]!).split('\n')[pulsed.frames[pulsed.frames.length - 1]!.height - 1] ?? '';
    expect(footer).toContain('54 fps • auto/full');
  });

  it('switches landing-screen themes with number keys and arrow cycling', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const numbered = await runScript(app, [{ key: '3' }], { ctx });
    const cycledRight = await runScript(app, [{ key: KEY_RIGHT }], { ctx });
    const cycledLeft = await runScript(app, [{ key: KEY_LEFT }], { ctx });

    expect((numbered.model as any).landingThemeIndex).toBe(2);
    expect((numbered.model as any).docsModel.pageModels.dogfood.landingThemeIndex).toBe(2);
    expect((cycledRight.model as any).landingThemeIndex).toBe(1);
    expect((cycledRight.model as any).docsModel.pageModels.dogfood.landingThemeIndex).toBe(1);
    expect((cycledLeft.model as any).landingThemeIndex).toBe(4);
    expect((cycledLeft.model as any).docsModel.pageModels.dogfood.landingThemeIndex).toBe(4);

    expect(serializeFrame(initial.frames[0]!)).not.toEqual(serializeFrame(numbered.frames[numbered.frames.length - 1]!));
    expect(serializeFrame(initial.frames[0]!)).not.toEqual(serializeFrame(cycledRight.frames[cycledRight.frames.length - 1]!));
  });

  it('carries the selected landing theme into the docs surfaces and settings', async () => {
    const defaultCtx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const defaultApp = createDocsApp(defaultCtx);
    const themedCtx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const themedApp = createDocsApp(themedCtx);

    const defaultDocs = await runScript(defaultApp, [{ key: KEY_ENTER }], { ctx: defaultCtx });
    const [defaultSettingsModel] = defaultApp.update(keyMsg('f2') as any, defaultDocs.model as any);
    const defaultSettingsFrame = normalizeViewOutput(defaultApp.view(defaultSettingsModel as any), {
      width: defaultCtx.runtime.columns,
      height: defaultCtx.runtime.rows,
    }).surface;
    const themedDocs = await runScript(themedApp, [
      { key: '2' },
      { key: KEY_ENTER },
    ], { ctx: themedCtx });

    const themedModel = themedDocs.model as any;
    const themedDocsSurface = normalizeViewOutput(themedApp.view(themedModel), {
      width: themedCtx.runtime.columns,
      height: themedCtx.runtime.rows,
    }).surface;
    const themedDocsText = frameText(themedDocsSurface);
    const [settingsModel] = themedApp.update(keyMsg('f2') as any, themedModel);
    const settingsFrame = normalizeViewOutput(themedApp.view(settingsModel as any), {
      width: themedCtx.runtime.columns,
      height: themedCtx.runtime.rows,
    }).surface;

    expect(themedModel.docsModel.pageModels.dogfood.landingThemeIndex).toBe(1);
    expect(themedDocsText).not.toContain('Theme:');
    expect(frameText(settingsFrame)).toContain('Landing theme');
    expect(frameText(settingsFrame)).toContain('Cabinet of Curiosities');
    expect(defaultSettingsFrame.get(20, 3).bg).not.toBe(settingsFrame.get(20, 3).bg);
  });

  it('shows a toast with the theme name when the landing theme changes and clears it later', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const switched = await runScript(app, [{ key: '2' }], { ctx });
    const switchedFrame = switched.frames[switched.frames.length - 1]!;
    expect(frameText(switchedFrame)).toContain('Cabinet of Curiosities');

    const settled = await runScript(app, [
      { key: '2' },
      { pulse: { dt: 2 } },
    ], { ctx });
    const settledFrame = settled.frames[settled.frames.length - 1]!;
    expect(frameText(settledFrame)).not.toContain('Cabinet of Curiosities');
  });

  it('lets the landing screen adjust quality before entering the docs and shows feedback', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const changed = await runScript(app, [{ key: KEY_DOWN }], { ctx });
    const frame = changed.frames[changed.frames.length - 1]!;
    const footer = frameText(frame).split('\n')[frame.height - 1] ?? '';

    expect((changed.model as any).docsModel.pageModels.dogfood.landingQualityMode).toBe('quality');
    expect(frameText(frame)).toContain('Landing quality: Quality');
    expect(footer).toContain('60 fps • quality');
  });

  it('expands a family, selects a story, and cycles its variants', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_ENTER },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
      { key: '.' },
    ], { ctx });

    const pageModel = (result.model as any).docsModel.pageModels['dogfood'];
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect((result.model as any).route).toBe('docs');
    expect(pageModel.selectedStoryId).toBe('alert');
    expect(pageModel.variantIndexByStory.alert).toBe(1);
    expect(text).toContain('active variant');
    expect(text).toContain('Current selection');
    expect(text).toContain('Warning');
    expect(text).toContain('Profile');
    expect(text).toContain('Rich');
    expect(text).toContain('Description');
  });

  it('opens component search with / and jumps directly to a component story', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: '/' },
      { key: 'm' },
      { key: 'o' },
      { key: 'd' },
      { key: KEY_ENTER },
    ], { ctx });

    const pageModel = (result.model as any).docsModel.pageModels['dogfood'];
    const frame = result.frames[result.frames.length - 1]!;
    const text = frameText(frame);

    expect(pageModel.selectedStoryId).toBe('modal');
    expect(pageModel.expandedFamilies['overlays-and-interruption']).toBe(true);
    expect((result.model as any).docsModel.commandPalette).toBeUndefined();
    expect(text).toContain('modal()');
    expect(text).toContain('Confirm deploy');
  });

  it('can open the new inspector story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: '/' },
      { key: 'i' },
      { key: 'n' },
      { key: 's' },
      { key: 'p' },
      { key: 'e' },
      { key: 'c' },
      { key: 't' },
      { key: 'o' },
      { key: 'r' },
      { key: KEY_ENTER },
    ], { ctx });

    const pageModel = (result.model as any).docsModel.pageModels['dogfood'];
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect(pageModel.selectedStoryId).toBe('inspector');
    expect(text).toContain('inspector()');
    expect(text).toContain('Current selection');
    expect(text).toContain('package summary');
  });

  it('can open the new toast story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: '/' },
      { key: 't' },
      { key: 'o' },
      { key: 'a' },
      { key: 's' },
      { key: 't' },
      { key: KEY_ENTER },
    ], { ctx });

    const pageModel = (result.model as any).docsModel.pageModels['dogfood'];
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect(pageModel.selectedStoryId).toBe('toast');
    expect(text).toContain('toast()');
    expect(text).toContain('Operation saved.');
  });

  it('can open the new markdown story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: '/' },
      { key: 'm' },
      { key: 'a' },
      { key: 'r' },
      { key: 'k' },
      { key: 'd' },
      { key: 'o' },
      { key: 'w' },
      { key: 'n' },
      { key: KEY_ENTER },
    ], { ctx });

    const pageModel = (result.model as any).docsModel.pageModels['dogfood'];
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect(pageModel.selectedStoryId).toBe('markdown');
    expect(text).toContain('markdown()');
    expect(text).toContain('Release note');
    expect(text).toContain('This slice');
    expect(text).toContain('Bijou keeps docs');
  });

  it('renders the hyperlink story without OSC 8 width corruption', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: '/' },
      { key: 'h' },
      { key: 'y' },
      { key: 'p' },
      { key: 'e' },
      { key: 'r' },
      { key: 'l' },
      { key: 'i' },
      { key: 'n' },
      { key: 'k' },
      { key: KEY_ENTER },
    ], { ctx });

    const text = frameText(result.frames[result.frames.length - 1]!);

    expect(text).toContain('hyperlink()');
    expect(text).toContain('Repository:');
    expect(text).toContain('flyingrobots/bijou');
    expect(text).toContain('API docs:');
    expect(text).toContain('README reference');
    expect(text).not.toContain('https://github.com/flyingrobots/bijou#readmeREA');
  });

  it('can open the new confirm story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: '/' },
      { key: 'c' },
      { key: 'o' },
      { key: 'n' },
      { key: 'f' },
      { key: 'i' },
      { key: 'r' },
      { key: 'm' },
      { key: KEY_ENTER },
    ], { ctx });

    const pageModel = (result.model as any).docsModel.pageModels['dogfood'];
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect(pageModel.selectedStoryId).toBe('confirm');
    expect(text).toContain('confirm()');
    expect(text).toContain('Deploy to production?');
    expect(text).toContain('Default');
    expect(text).toContain('No');
  });

  it('keeps ctrl+p as the generic command palette while / is component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const openedSearch = await runScript(app, [
      { key: KEY_ENTER },
      { key: '/' },
    ], { ctx });
    expect(frameText(openedSearch.frames[openedSearch.frames.length - 1]!)).toContain('Search components');

    const openedPalette = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_CTRL_P },
    ], { ctx });
    const paletteText = frameText(openedPalette.frames[openedPalette.frames.length - 1]!);
    expect(paletteText).toContain('Command Palette');
    expect(paletteText).not.toContain('Search components');
  });

  it('closes component search with escape without opening quit confirm', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: '/' },
      { key: KEY_ESCAPE },
    ], { ctx });

    expect((result.model as any).docsModel.commandPalette).toBeUndefined();
    expect((result.model as any).docsModel.quitConfirmOpen).toBe(false);

    const frame = result.frames[result.frames.length - 1]!;
    const text = frameText(frame);
    expect(text).not.toContain('Search components');
    expect(text).toContain('welcome to bijou');
  });

  it('opens the standard shell settings drawer with F2 and toggles visible DOGFOOD preferences', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const entered = await runScript(app, [{ key: KEY_ENTER }], { ctx });
    let model = entered.model as any;
    let updateResult = app.update(keyMsg('f2') as any, model);
    model = updateResult[0] as any;
    let settingsFrame = normalizeViewOutput(app.view(model), {
      width: ctx.runtime.columns,
      height: ctx.runtime.rows,
    }).surface;
    expect(frameText(settingsFrame)).toContain('☑ On');
    expect(frameText(settingsFrame)).toContain('Show active-pane control');
    expect(frameText(settingsFrame)).toContain('cues in the footer');
    expect(frameText(settingsFrame)).toContain('Appearance');
    expect(frameText(settingsFrame)).toContain('↻ Landing theme');
    expect(frameText(settingsFrame)).toContain('Storybook Workstation');
    expect(frameText(settingsFrame)).toContain('Landing');
    expect(frameText(settingsFrame)).toContain('Adapts render cost to');
    expect(frameText(settingsFrame)).toContain('Options:');
    expect(frameText(settingsFrame)).toContain('Auto, Quality, Balanced');
    expect(frameText(settingsFrame)).toContain('↻ Landing quality');
    expect(frameText(settingsFrame)).toContain('Auto (ful');
    updateResult = app.update(keyMsg('enter') as any, model);
    model = updateResult[0] as any;
    const commandResult = await updateResult[1][0]!(() => {}, {
      onPulse() {
        return { dispose() {} };
      },
    });
    if (commandResult !== undefined && commandResult !== QUIT) {
      model = app.update(commandResult as any, model)[0] as any;
    }
    let frame = normalizeViewOutput(app.view(model), {
      width: ctx.runtime.columns,
      height: ctx.runtime.rows,
    }).surface;
    expect(model.docsModel.runtimeNotifications.items[0]?.message).toBe('Show hints turned off.');
    expect(frameText(frame)).toContain('notices:1');
    updateResult = app.update(keyMsg('down') as any, model);
    model = updateResult[0] as any;
    updateResult = app.update(keyMsg('down') as any, model);
    model = updateResult[0] as any;
    updateResult = app.update(keyMsg('enter') as any, model);
    model = updateResult[0] as any;
    const secondCommandResult = await updateResult[1][0]!(() => {}, {
      onPulse() {
        return { dispose() {} };
      },
    });
    if (secondCommandResult !== undefined && secondCommandResult !== QUIT) {
      model = app.update(secondCommandResult as any, model)[0] as any;
    }
    updateResult = app.update(keyMsg('f2') as any, model);
    model = updateResult[0] as any;

    frame = normalizeViewOutput(app.view(model), {
      width: ctx.runtime.columns,
      height: ctx.runtime.rows,
    }).surface;
    const text = frameText(frame);
    const footer = text.split('\n')[frame.height - 1] ?? '';
    const pageModel = model.docsModel.pageModels['dogfood'];
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

  it('shows accordion-style family headers without the oversized custom help strip', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 40 } });
    const app = createDocsApp(ctx);

    const entered = await runScript(app, [{ key: KEY_ENTER }], { ctx });
    const frame = entered.frames[entered.frames.length - 1]!;

    let text = '';
    for (let y = 0; y < frame.height; y++) {
      for (let x = 0; x < frame.width; x++) {
        text += frame.get(x, y).char || ' ';
      }
      text += '\n';
    }

    const lines = text.split('\n');
    expect(text).toContain('▶ Status and in-flow feedback');
    expect(lines[0]).toContain('Bijou Docs');
    expect(lines[frame.height - 1]).toContain('? Help');
    expect(lines[frame.height - 1]).toContain('/ Search');
    expect(lines[frame.height - 1]).toContain('F2 Settings');
    expect(lines[frame.height - 1]).toContain('Tab next pane');
    expect(lines[frame.height - 1]).toContain('↑/↓ browse');
    expect(lines[frame.height - 1]).toContain('Enter open');
    expect(lines.slice(0, frame.height - 1).join('\n')).not.toContain('↑/↓ browse • Enter open • Tab next pane');
  });

  it('shows a Bijou introduction and docs guide when no component is selected', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 40 } });
    const app = createDocsApp(ctx);
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    const entered = await runScript(app, [{ key: KEY_ENTER }], { ctx });
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
    const openDocs = [{ key: KEY_ENTER }] as const;
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
      { key: KEY_ENTER },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
      { key: KEY_TAB },
      { key: KEY_DOWN },
      { key: KEY_TAB },
      { key: KEY_DOWN },
    ], { ctx });

    const pageModel = (result.model as any).docsModel.pageModels['dogfood'];
    expect(pageModel.familyState.items[pageModel.familyState.focusIndex]?.value).toBe('story:alert');
    expect(pageModel.variantIndexByStory.alert).toBe(1);
    expect((result.model as any).docsModel.focusedPaneByPage.dogfood).toBe('story-variants');
  });

  it('updates the footer hints to match the focused pane instead of leaving stale family controls visible', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_ENTER },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
      { key: KEY_TAB },
      { key: KEY_TAB },
    ], { ctx });

    const frame = result.frames[result.frames.length - 1]!;
    const footer = frameText(frame).split('\n')[frame.height - 1] ?? '';

    expect((result.model as any).docsModel.focusedPaneByPage.dogfood).toBe('story-variants');
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
    expect((opened.model as any).docsModel.quitConfirmOpen).toBe(true);
    expect(frameText(opened.frames[opened.frames.length - 1]!)).toContain('Quit?');

    const dismissed = await runScript(app, [
      { key: KEY_ENTER },
      { key: 'q' },
      { key: 'n' },
    ], { ctx });
    expect((dismissed.model as any).docsModel.quitConfirmOpen).toBe(false);
  });
});
