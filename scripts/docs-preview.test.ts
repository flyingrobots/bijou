import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { createDocsApp } from '../examples/docs/app.js';
import { QUIT } from '../packages/bijou-tui/src/types.js';
import { normalizeViewOutput } from '../packages/bijou-tui/src/view-output.js';

const KEY_ENTER = '\r';
const KEY_DOWN = '\x1b[B';
const KEY_LEFT = '\x1b[D';
const KEY_RIGHT = '\x1b[C';
const KEY_ESCAPE = '\x1b';
const KEY_TAB = '\t';

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

    expect(text).toContain('Press [Enter]');
    expect(text).toContain('Esc/q quit • any key continue');
    expect(text).toContain('v4.0.0');
    expect(text).toContain('73 fps • full');
    expect(text).toContain('8""""');
    expect(text).not.toContain('What is Bijou?');
    expect(text).not.toContain('How to use these docs');
    expect(text).toMatch(/[█▓▒░·]/);
  });

  it('quits from the landing screen with escape', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
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
    expect(frameText(initial.frames[0]!)).toContain('60 fps • performance');
  });

  it('updates the landing refresh-rate readout from pulse cadence', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const pulsed = await runScript(app, [{ pulse: { dt: 1 / 30 } }], { ctx });

    expect((pulsed.model as any).landingFps).toBe(54);
    expect(frameText(pulsed.frames[pulsed.frames.length - 1]!)).toContain('54 fps • full');
  });

  it('switches landing-screen themes with number keys and arrow cycling', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const numbered = await runScript(app, [{ key: '3' }], { ctx });
    const cycledRight = await runScript(app, [{ key: KEY_RIGHT }], { ctx });
    const cycledLeft = await runScript(app, [{ key: KEY_LEFT }], { ctx });

    expect((numbered.model as any).landingThemeIndex).toBe(2);
    expect((cycledRight.model as any).landingThemeIndex).toBe(1);
    expect((cycledLeft.model as any).landingThemeIndex).toBe(4);

    expect(serializeFrame(initial.frames[0]!)).not.toEqual(serializeFrame(numbered.frames[numbered.frames.length - 1]!));
    expect(serializeFrame(initial.frames[0]!)).not.toEqual(serializeFrame(cycledRight.frames[cycledRight.frames.length - 1]!));
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

    expect((result.model as any).route).toBe('docs');
    expect(pageModel.selectedStoryId).toBe('alert');
    expect(pageModel.variantIndexByStory.alert).toBe(1);
  });

  it('opens the standard command palette with / and jumps directly to a component story', async () => {
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

  it('opens the standard shell settings drawer with F2 and toggles a visible DOGFOOD preference', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const entered = await runScript(app, [{ key: KEY_ENTER }], { ctx });
    let model = entered.model as any;
    let updateResult = app.update(keyMsg('f2') as any, model);
    model = updateResult[0] as any;
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
    updateResult = app.update(keyMsg('escape') as any, model);
    model = updateResult[0] as any;

    const frame = normalizeViewOutput(app.view(model), {
      width: ctx.runtime.columns,
      height: ctx.runtime.rows,
    }).surface;
    const text = frameText(frame);
    const pageModel = model.docsModel.pageModels['dogfood'];
    expect(model.docsModel.settingsOpen).toBe(false);
    expect(pageModel.showHints).toBe(false);
    expect(text).not.toContain('↑/↓ browse • Enter open • Tab next pane');
    expect(text).not.toContain(',/. cycle • 1-4 profiles');
    expect(text).not.toContain('scroll: j/k • d/u • g/G • mouse wheel');
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

    expect(text).toContain('▶ Status and in-flow feedback');
    expect(text).toContain('? Help');
    expect(text).toContain('/ Search');
    expect(text).toContain('F2 Settings');
  });

  it('shows a Bijou introduction and docs guide when no component is selected', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 40 } });
    const app = createDocsApp(ctx);

    const entered = await runScript(app, [{ key: KEY_ENTER }], { ctx });
    const frame = entered.frames[entered.frames.length - 1]!;
    const lines = frameText(frame).split('\n');
    const text = lines.join('\n');

    expect(lines[2]?.trim()).toBe('');
    expect(text).toContain('What is Bijou?');
    expect(text).toContain('How to use these docs');
    expect(text).toContain('/ to search');
    expect(text).toContain('F2 for settings');
    expect(text).toContain('surface-native terminal UI framework');
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
