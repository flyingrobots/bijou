import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { colorHex, type ColorRef } from '@flyingrobots/bijou';
import { _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import { parseKey } from '@flyingrobots/bijou-tui';
import {
  createScriptTestContext as createTestContext,
  runScriptDeterministic as runScript,
} from '../tests/helpers/scripted.js';
import { createDocsApp, DOGFOOD_I18N_CATALOG, FRAME_I18N_CATALOG } from '../examples/docs/app.js';
import { resolveDogfoodDocsCoverage } from '../examples/docs/coverage.js';
import { createNodeDocsApp } from '../examples/docs/node-app.js';
import { COMPONENT_STORIES } from '../examples/docs/stories.js';
import {
  DOGFOOD_NON_INTERACTIVE_MESSAGE,
  DOGFOOD_TERMINAL_NOTICE,
  dogfoodTerminalReadiness,
} from '../examples/docs/terminal-guard.js';
import { pseudoLocalize } from '../packages/bijou-i18n-tools/src/index.js';
import { wrapPageMsg } from '../packages/bijou-tui/src/app-frame-types.js';
import { QUIT } from '../packages/bijou-tui/src/types.js';
import { normalizeViewOutput } from '../packages/bijou-tui/src/view-output.js';

const BIJOU_VERSION: string = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '..', 'packages', 'bijou', 'package.json'), 'utf8'),
).version;

const KEY_ENTER = '\r';
const KEY_DOWN = '\x1b[B';
const KEY_LEFT = '\x1b[D';
const KEY_RIGHT = '\x1b[C';
const KEY_ESCAPE = '\x1b';
const KEY_F2 = '\x1bOQ';
const KEY_TAB = '\t';
const KEY_CTRL_P = '\x10';
const KEY_NEXT_TAB = ']';
const V7_RASTER_TITLE_GLYPHS = new Set(['░', '▒', '▓', '█']);

function keyMsg(key: string, options: { ctrl?: boolean; alt?: boolean; shift?: boolean } = {}) {
  return {
    type: 'key' as const,
    key,
    ctrl: options.ctrl ?? false,
    alt: options.alt ?? false,
    shift: options.shift ?? false,
  };
}

function serializeFrame(frame: { width: number; height: number; get(x: number, y: number): { char?: string; fg?: ColorRef; bg?: ColorRef } }) {
  const cells: string[] = [];
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const cell = frame.get(x, y);
      cells.push(`${cell.char ?? ' '}|${colorHex(cell.fg) ?? ''}|${colorHex(cell.bg) ?? ''}`);
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

function rasterTitleGlyphCount(text: string): number {
  return Array.from(text).filter((char) => V7_RASTER_TITLE_GLYPHS.has(char)).length;
}

function cellsWithoutBackground(frame: {
  width: number;
  height: number;
  get(x: number, y: number): { bg?: ColorRef; bgRGB?: readonly [number, number, number] };
}) {
  const missing: string[] = [];
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const cell = frame.get(x, y);
      if (cell.bg == null && cell.bgRGB == null) {
        missing.push(`${x},${y}`);
      }
    }
  }
  return missing;
}

function activeDocsPageModel(model: any) {
  return model.docsModel.pageModels[model.docsModel.activePageId];
}

function docsPageModel(model: any, pageId: string) {
  return model.docsModel.pageModels[pageId];
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
  afterEach(() => _resetDefaultContextForTesting());

  it('uses the live local runtime entrypoint instead of the packaged build', () => {
    const source = readFileSync(new URL('../examples/docs/main.ts', import.meta.url), 'utf8');

    expect(source).toContain("../../packages/bijou-node/src/index.js");
    expect(source).toContain("../../packages/bijou-tui/src/index.js");
    expect(source).toContain("import { createNodeDocsApp } from './node-app.js';");
    expect(source).toContain('createNodeDocsApp(ctx)');
    expect(source).toContain('dogfoodTerminalReadiness(ctx)');
    expect(source).toContain('DOGFOOD_TERMINAL_NOTICE');
  });

  it('explains DOGFOOD terminal takeover and non-TTY failure modes', () => {
    const ready = dogfoodTerminalReadiness(createTestContext({
      runtime: { stdinIsTTY: true, stdoutIsTTY: true },
    }));
    const pipedStdout = dogfoodTerminalReadiness(createTestContext({
      runtime: { stdinIsTTY: true, stdoutIsTTY: false },
    }));
    const pipedStdin = dogfoodTerminalReadiness(createTestContext({
      runtime: { stdinIsTTY: false, stdoutIsTTY: true },
    }));

    expect(ready).toEqual({ ok: true });
    expect(pipedStdout).toEqual({ ok: false, message: DOGFOOD_NON_INTERACTIVE_MESSAGE });
    expect(pipedStdin).toEqual({ ok: false, message: DOGFOOD_NON_INTERACTIVE_MESSAGE });
    expect(DOGFOOD_NON_INTERACTIVE_MESSAGE).toContain('stdin and stdout');
    expect(DOGFOOD_NON_INTERACTIVE_MESSAGE).toContain('npm run smoke:dogfood');
    expect(DOGFOOD_TERMINAL_NOTICE).toContain('full-screen interactive TUI');
    expect(DOGFOOD_TERMINAL_NOTICE).toContain('press q');
    expect(DOGFOOD_TERMINAL_NOTICE).toContain('Ctrl-C');
  });

  it('builds the Node DOGFOOD app through the locale adapter instead of process reads in view code', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createNodeDocsApp(ctx, { LC_ALL: 'fr_FR.UTF-8' });

    const result = await runScript(app, [{ key: KEY_ENTER }, { key: KEY_F2 }], { ctx });

    expect(frameText(result.frames.at(-1)!)).toContain('Langue préférée');
  });

  it('imports the DOGFOOD app through the same tsx path used by npm run dogfood', () => {
    execFileSync(
      process.execPath,
      ['--import', 'tsx', '--input-type=module', '-e', "await import('./examples/docs/app.ts')"],
      {
        cwd: resolve(import.meta.dirname, '..'),
        stdio: 'pipe',
      },
    );
  });

  it('builds the framed explorer shell from the provided ctx without relying on a default singleton', async () => {
    _resetDefaultContextForTesting();
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs' });

    const result = await runScript(app, [], { ctx });
    expect((result.model as any).route).toBe('docs');
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
    expect(footer).toContain(`v${BIJOU_VERSION}`);
    expect(footer).toMatch(/\d+ fps • auto\/full/);
    expect(lines[0]).not.toMatch(/\d+ fps/);
    expect(text).not.toContain('Documentation coverage');
    expect(text).toContain('DOGFOOD');
    expect(text).toContain('Documentation Of Good');
    expect(text).toContain('V7 Launch Wake');
    expect(text).toContain('8""""');
    expect(text).not.toContain('What is Bijou?');
    expect(text).not.toContain('How to use these docs');
    // Gradient background chars (█▓▒░·) require pulse-driven animation;
    // the initial frame without pulses may not contain them. The pulse
    // test below ('animates the landing title screen on pulse') covers this.
  });

  it('keeps every landing title cell on a Bijou-owned background', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 200, rows: 60, refreshRate: 73 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const frame = initial.frames[0]!;

    expect(cellsWithoutBackground(frame)).toEqual([]);
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
    const text = frameText(entered.frames.at(-1)!);
    expect(text).toContain(pseudoLocalize('Guides'));
    expect(text).toMatch(/Šëàřçħ/);
  });

  it('localizes the DOGFOOD surface block inventory page from the catalog', async () => {
    const locale = 'qps-ploc';
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 48, refreshRate: 60 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      initialPageId: 'blocks',
      locale,
      direction: 'ltr',
      extraI18nCatalogs: [
        withLocaleValues(DOGFOOD_I18N_CATALOG, locale, (value) => pseudoLocalize(value)),
      ],
    });

    const selected = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: wrapPageMsg('blocks', { type: 'select-guide', guideId: 'blocks-dogfood-surfaces' }),
      },
    }], { ctx });
    const text = frameText(selected.frames.at(-1)!);

    expect(text).toContain(pseudoLocalize('DOGFOOD Surface Blocks'));
    expect(text).toContain(pseudoLocalize('Surface index'));
    expect(text).toContain(pseudoLocalize('DOGFOOD title and entry action surface.'));
    expect(text).not.toContain('DOGFOOD currently registers');
    expect(text).not.toContain('DOGFOOD title and entry action surface.');
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

  it('renders the decoded raster-to-glyph V7 title image on the landing title screen', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const pulsed = await runScript(app, [{ pulse: { dt: 0.35 } }], { ctx });

    const initialText = frameText(initial.frames[0]!);
    const pulsedText = frameText(pulsed.frames[pulsed.frames.length - 1]!);

    expect(rasterTitleGlyphCount(initialText)).toBeGreaterThan(1000);
    expect(rasterTitleGlyphCount(pulsedText)).toBeGreaterThan(1000);
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
    expect(activeDocsPageModel(numbered.model as any).landingThemeIndex).toBe(2);
    expect((cycledRight.model as any).landingThemeIndex).toBe(1);
    expect(activeDocsPageModel(cycledRight.model as any).landingThemeIndex).toBe(1);
    expect((cycledLeft.model as any).landingThemeIndex).toBe(5);
    expect(activeDocsPageModel(cycledLeft.model as any).landingThemeIndex).toBe(5);
    expect((cycledLeft.model as any).docsModel.activeShellThemeId).toBe('verdant-plum');

    expect(serializeFrame(initial.frames[0]!)).not.toEqual(serializeFrame(numbered.frames[numbered.frames.length - 1]!));
    expect(serializeFrame(initial.frames[0]!)).not.toEqual(serializeFrame(cycledRight.frames[cycledRight.frames.length - 1]!));
  });

  it('carries the selected landing theme into docs through the shared shell theme setting', async () => {
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

    expect(activeDocsPageModel(themedModel).landingThemeIndex).toBe(1);
    expect(themedModel.docsModel.activeShellThemeId).toBe('cabinet-of-curiosities');
    expect(themedDocsText).not.toContain('Theme:');
    expect(frameText(settingsFrame)).toContain('Shell theme');
    expect(frameText(settingsFrame)).toContain('Cabinet of Curiosities');
    expect(frameText(settingsFrame)).not.toContain('Landing theme');
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

    expect(activeDocsPageModel(changed.model as any).landingQualityMode).toBe('quality');
    expect(frameText(frame)).toContain('Landing quality: Quality');
    expect(footer).toContain('60 fps • quality');
  });

  it('expands a family, selects a story, and cycles its variants', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: KEY_ENTER },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
      { key: '.' },
    ], { ctx });

    const pageModel = docsPageModel(result.model as any, 'components');
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
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 'm' },
      { key: 'o' },
      { key: 'd' },
      { key: KEY_ENTER },
    ], { ctx });

    const pageModel = docsPageModel(result.model as any, 'components');
    const frame = result.frames[result.frames.length - 1]!;
    const text = frameText(frame);

    expect(pageModel.selectedStoryId).toBe('modal');
    expect(pageModel.expandedFamilies['overlays-and-interruption']).toBe(true);
    expect((result.model as any).docsModel.commandPalette).toBeUndefined();
    expect(text).toContain('modal()');
    expect(text).toContain('Confirm deploy');
  });

  it('opens documentation search with / and prioritizes the table component result', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 't' },
      { key: 'a' },
      { key: 'b' },
      { key: 'l' },
      { key: 'e' },
      { key: KEY_ENTER },
    ], { ctx });

    const pageModel = docsPageModel(result.model as any, 'components');
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect((result.model as any).docsModel.activePageId).toBe('components');
    expect(pageModel.selectedStoryId).toBe('dense-comparison');
    expect(pageModel.expandedFamilies['data-and-browsing']).toBe(true);
    expect(text).toContain('table() / navigableTableSurface()');
  });

  it('opens documentation search results on other DOGFOOD pages', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 'm' },
      { key: 'i' },
      { key: 'g' },
      { key: 'r' },
      { key: 'a' },
      { key: 't' },
      { key: 'i' },
      { key: 'o' },
      { key: 'n' },
      { key: KEY_ENTER },
    ], { ctx });

    const pageModel = docsPageModel(result.model as any, 'release');
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect((result.model as any).docsModel.activePageId).toBe('release');
    expect(pageModel.selectedGuideId).toContain('release-migration');
    expect(text).toContain('Migration Guide');
  });

  it('lets documentation search results be browsed with arrow keys before selection', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 't' },
      { key: 'a' },
      { key: 'b' },
      { key: 'l' },
      { key: 'e' },
      { key: KEY_DOWN },
    ], { ctx });

    expect((result.model as any).docsModel.commandPalette?.query).toBe('table');
    expect((result.model as any).docsModel.commandPalette?.focusIndex).toBe(1);
    expect(frameText(result.frames[result.frames.length - 1]!)).toContain('Search documentation');
  });

  it('can open the new inspector story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
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

    const pageModel = docsPageModel(result.model as any, 'components');
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
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 't' },
      { key: 'o' },
      { key: 'a' },
      { key: 's' },
      { key: 't' },
      { key: KEY_ENTER },
    ], { ctx });

    const pageModel = docsPageModel(result.model as any, 'components');
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
      { key: KEY_NEXT_TAB },
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

    const pageModel = docsPageModel(result.model as any, 'components');
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect(pageModel.selectedStoryId).toBe('markdown');
    expect(text).toContain('markdown()');
    expect(text).toContain('Release note');
    expect(text).toContain('This slice');
    expect(text).toContain('Bijou keeps docs');
  });

  it('demonstrates every table variant in the DOGFOOD dense-comparison story', () => {
    const story = COMPONENT_STORIES.find((candidate) => candidate.id === 'dense-comparison');
    expect(story).toBeDefined();

    const variantIds = story!.variants.map((variant) => variant.id);
    expect(variantIds).toEqual([
      'box',
      'ascii-grid',
      'ruled',
      'header-rule',
      'plain',
      'markdown-table',
      'definition',
      'expanded',
      'pipe-tsv',
      'pipe-csv',
      'pipe-markdown',
      'pipe-ascii-grid',
      'focused-inspection',
    ]);

    const renderVariant = (variantId: string): string => {
      const variant = story!.variants.find((candidate) => candidate.id === variantId);
      expect(variant).toBeDefined();
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 64, rows: 24 } });
      const preview = variant!.render({
        width: 60,
        ctx,
        state: undefined as never,
        timeMs: 0,
      });
      if (typeof preview === 'string') return preview;
      return frameText(normalizeViewOutput(preview, { width: 60, height: 24 }).surface);
    };

    expect(renderVariant('box')).toContain('┌');
    expect(renderVariant('ascii-grid')).toContain('+');
    expect(renderVariant('ruled')).toContain('━━━━━━━━');
    expect(renderVariant('header-rule')).toContain('---------');
    expect(renderVariant('plain')).toContain('Component');
    expect(renderVariant('markdown-table')).toContain('| Component');
    expect(renderVariant('definition')).toContain('Field');
    expect(renderVariant('definition')).toContain('Value');
    expect(renderVariant('expanded')).toContain('-[ RECORD 1 ]');
    expect(renderVariant('pipe-tsv')).toContain('Component\tBehavior\tOwner');
    expect(renderVariant('pipe-csv')).toContain('Component,Behavior,Owner');
    expect(renderVariant('pipe-csv')).toContain('"Exports rows to TSV, CSV, Markdown, or ASCII grid."');
    expect(renderVariant('pipe-markdown')).toContain('| Component');
    expect(renderVariant('pipe-ascii-grid')).toContain('+');
    expect(renderVariant('focused-inspection')).toContain('focused table');
  });

  it('renders the Documentation Map guide tables instead of leaking raw markdown', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_DOWN },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
    ], { ctx });

    const pageModel = docsPageModel(result.model as any, 'guides');
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect(pageModel.selectedGuideId).toBe('documentation-map');
    expect(text).toContain('┌');
    expect(text).toContain('┬');
    expect(text).toContain('Surface');
    expect(text).toContain('Role');
    expect(text).toContain('Public front door');
    expect(text).not.toContain('| Surface | Role |');
    expect(text).not.toContain('| :--- | :--- |');
  });

  it('renders the hyperlink story without OSC 8 width corruption', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
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
      { key: KEY_NEXT_TAB },
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

    const pageModel = docsPageModel(result.model as any, 'components');
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect(pageModel.selectedStoryId).toBe('confirm');
    expect(text).toContain('confirm()');
    expect(text).toContain('Deploy to production?');
    expect(text).toContain('Default');
    expect(text).toContain('No');
  });

  it('can open the new tabs story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 't' },
      { key: 'a' },
      { key: 'b' },
      { key: 's' },
      { key: KEY_ENTER },
    ], { ctx });

    const pageModel = docsPageModel(result.model as any, 'components');
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect(pageModel.selectedStoryId).toBe('tabs');
    expect(text).toContain('tabs()');
    expect(text).toContain('Current pane');
    expect(text).toContain('Rollout');
  });

  it('can open the new group and wizard story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 'w' },
      { key: 'i' },
      { key: 'z' },
      { key: KEY_ENTER },
      { key: '.' },
    ], { ctx });

    const pageModel = docsPageModel(result.model as any, 'components');
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect(pageModel.selectedStoryId).toBe('group-wizard');
    expect(text).toContain('group() / wizard()');
    expect(text).toContain('Step 2 of 3');
    expect(text).toContain('Verification');
  });

  it('can open the new explainability story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 'e' },
      { key: 'x' },
      { key: 'p' },
      { key: 'l' },
      { key: 'a' },
      { key: 'i' },
      { key: 'n' },
      { key: KEY_ENTER },
    ], { ctx });

    const pageModel = docsPageModel(result.model as any, 'components');
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect(pageModel.selectedStoryId).toBe('explainability');
    expect(text).toContain('explainability()');
    expect(text).toContain('[AI]');
    expect(text).toContain('Evidence');
    expect(text).toContain('Promote the canary build');
  });

  it('can open the new help story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 'h' },
      { key: 'e' },
      { key: 'l' },
      { key: 'p' },
      { key: 'v' },
      { key: KEY_ENTER },
      { key: '.' },
    ], { ctx });

    const pageModel = docsPageModel(result.model as any, 'components');
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect(pageModel.selectedStoryId).toBe('help-view');
    expect(text).toContain('helpView() / helpShortSurface()');
    expect(text).toContain('Keyboard shortcuts');
    expect(text).toContain('Navigation');
    expect(text).toContain('Open help');
  });

  it('can open the new app-shell story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 'p' },
      { key: 'a' },
      { key: 'l' },
      { key: 'e' },
      { key: 't' },
      { key: 't' },
      { key: 'e' },
      { key: KEY_ENTER },
      { key: '.' },
    ], { ctx });

    const pageModel = docsPageModel(result.model as any, 'components');
    const text = frameText(result.frames[result.frames.length - 1]!);

    expect(pageModel.selectedStoryId).toBe('app-shell');
    expect(text).toContain('createFramedApp()');
    expect(text).toContain('command palette');
    expect(text).toContain('Current page');
  });

  it('keeps ctrl+p as the generic command palette while / is documentation search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const openedSearch = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
    ], { ctx });
    expect(frameText(openedSearch.frames[openedSearch.frames.length - 1]!)).toContain('Search documentation');

    const openedPalette = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: KEY_CTRL_P },
    ], { ctx });
    const paletteText = frameText(openedPalette.frames[openedPalette.frames.length - 1]!);
    expect(paletteText).toContain('Command Palette');
    expect(paletteText).not.toContain('Search documentation');
  });

  it('closes documentation search with escape without opening quit confirm', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: KEY_ESCAPE },
    ], { ctx });

    expect((result.model as any).docsModel.commandPalette).toBeUndefined();
    expect((result.model as any).docsModel.quitConfirmOpen).toBe(false);

    const frame = result.frames[result.frames.length - 1]!;
    const text = frameText(frame);
    expect(text).not.toContain('Search documentation');
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
    expect(frameText(settingsFrame)).toContain('↻ Shell theme');
    expect(frameText(settingsFrame)).toContain('BlockLab Workstation');
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

  it('routes landing F2 into the shell settings layer and lets escape dismiss it without quitting', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    let [model] = app.init();
    [model] = app.update(parseKey(KEY_F2) as any, model);
    expect((model as any).route).toBe('docs');
    expect((model as any).docsModel.settingsOpen).toBe(true);
    expect((model as any).docsModel.quitConfirmOpen).toBe(false);

    [model] = app.update(parseKey(KEY_ESCAPE) as any, model);
    expect((model as any).route).toBe('docs');
    expect((model as any).docsModel.settingsOpen).toBe(false);
    expect((model as any).docsModel.quitConfirmOpen).toBe(false);
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

    const pageModel = docsPageModel(result.model as any, 'components');

    expect(pageModel.familyState.height).toBeGreaterThan(14);
    expect(pageModel.familyState.focusIndex).toBe(14);
    expect(pageModel.familyState.scrollY).toBe(0);
  });

  it('renders the family pane through a viewport-backed scrollbar when it overflows', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 16 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [{ key: KEY_ENTER }, { key: KEY_NEXT_TAB }], { ctx });
    const frame = result.frames.at(-1)!;
    const pageModel = docsPageModel(result.model as any, 'components');
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

    const pageModel = docsPageModel(result.model as any, 'components');
    expect(pageModel.familyState.items[pageModel.familyState.focusIndex]?.value).toBe('story:alert');
    expect(pageModel.variantIndexByStory.alert).toBe(1);
    expect((result.model as any).docsModel.focusedPaneByPage.components).toBe('story-variants');
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

    expect((result.model as any).docsModel.focusedPaneByPage.components).toBe('story-variants');
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
