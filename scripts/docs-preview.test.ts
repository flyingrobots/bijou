import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { createDocsApp } from '../examples/docs/app.js';

const KEY_ENTER = '\r';
const KEY_DOWN = '\x1b[B';

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

describe('docs preview app', () => {
  it('lands on the hero page first and enters the docs on Enter', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    expect((initial.model as any).route).toBe('landing');

    const entered = await runScript(app, [{ key: KEY_ENTER }], { ctx });
    expect((entered.model as any).route).toBe('docs');
  });

  it('renders the landing page as pure animated art without the old copy or stats chrome', async () => {
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

    expect(text).not.toContain('The docs are the demo');
    expect(text).not.toContain('Press Enter to enter the docs.');
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

    const pageModel = (result.model as any).docsModel.pageModels['learn-by-touch'];

    expect((result.model as any).route).toBe('docs');
    expect(pageModel.selectedStoryId).toBe('alert');
    expect(pageModel.variantIndexByStory.alert).toBe(1);
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
});
