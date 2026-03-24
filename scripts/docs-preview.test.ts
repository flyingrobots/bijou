import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { createDocsApp } from '../examples/docs/app.js';

const KEY_ENTER = '\r';
const KEY_CTRL_P = '\x10';
const KEY_DOWN = '\x1b[B';
const KEY_LEFT = '\x1b[D';
const KEY_RIGHT = '\x1b[C';
const KEY_ESCAPE = '\x1b';
const KEY_TAB = '\t';

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
  it('lands on the hero page first and enters the docs on Enter', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    expect((initial.model as any).route).toBe('landing');

    const entered = await runScript(app, [{ key: KEY_ENTER }], { ctx });
    expect((entered.model as any).route).toBe('docs');
  });

  it('renders the landing page with the animated title treatment and minimal entry copy', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 200, rows: 60 } });
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
    expect(text).toContain('Copyright © 2026 James Ross • FlyingRobots');
    expect(text).toContain('8""""');
    expect(text).not.toContain('The docs are the demo');
    expect(text).not.toContain('Families');
    expect(text).not.toContain('Stories');
    expect(text).not.toContain('Profiles');
    expect(text).toMatch(/[█▓▒░·]/);
  });

  it('animates the landing title screen on pulse', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const pulsed = await runScript(app, [{ pulse: { dt: 0.35 } }], { ctx });

    expect((pulsed.model as any).route).toBe('landing');
    expect(serializeFrame(initial.frames[0]!)).not.toEqual(serializeFrame(pulsed.frames[pulsed.frames.length - 1]!));
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

  it('opens the standard command palette and jumps directly to a component story', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_CTRL_P },
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

  it('toggles a visible DOGFOOD preference through the standard shell settings drawer', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_CTRL_P },
      { key: 's' },
      { key: 'e' },
      { key: 't' },
      { key: 't' },
      { key: 'i' },
      { key: 'n' },
      { key: 'g' },
      { key: 's' },
      { key: KEY_ENTER },
      { key: KEY_ENTER },
      { key: KEY_ESCAPE },
    ], { ctx });
    const text = frameText(result.frames[result.frames.length - 1]!);
    const pageModel = (result.model as any).docsModel.pageModels['dogfood'];
    expect(pageModel.showHints).toBe(false);
    expect((result.model as any).docsModel.settingsOpen).toBe(false);
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
    expect(text).not.toContain('Expand family');
    expect(text).not.toContain('Collapse family');
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
});
