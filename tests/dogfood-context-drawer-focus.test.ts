import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createTestContext } from '../packages/bijou/src/adapters/test/index.js';
import type { Surface } from '../packages/bijou/src/index.js';
import { runScript } from '../packages/bijou-tui/src/driver.js';
import type { KeyMsg, ResizeMsg } from '../packages/bijou-tui/src/index.js';
import { createDocsApp } from '../examples/docs/app.js';
import { CONTEXT_DRAWER_PANE_ID, docsShellPaneIds } from '../examples/docs/app-context-drawer.js';
import { isDocsPageId } from '../examples/docs/app-ids.js';
import type { RootModel } from '../examples/docs/app-model.js';

const key = (name: string, shift = false): KeyMsg => ({ type: 'key', key: name, ctrl: false, alt: false, shift });
const resize = (columns: number, rows: number): ResizeMsg => ({ type: 'resize', columns, rows });
type Step = KeyMsg | ResizeMsg;

function boot(columns: number, rows: number, initialPageId: 'components' | 'guides' = 'components') {
  const ctx = createTestContext({ mode: 'interactive', runtime: { columns, rows } });
  const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId });
  const run = (model: RootModel, steps: readonly Step[]): RootModel =>
    steps.reduce((current, step) => app.update(step, current)[0], model);
  return { run, model: run(app.init()[0], [resize(columns, rows)]) };
}

const active = (model: RootModel) => {
  const pageId = model.docsModel.activePageId;
  const page = model.docsModel.pageModels[pageId];
  if (page === undefined || !isDocsPageId(pageId)) throw new Error(`Missing page ${pageId}`);
  return { pageId, page, focused: model.docsModel.focusedPaneByPage[pageId] };
};

function focusPane(run: (m: RootModel, s: readonly Step[]) => RootModel, model: RootModel, paneId: string): RootModel {
  let current = model;
  for (let i = 0; i < 4 && active(current).focused !== paneId; i += 1) current = run(current, [key('tab')]);
  expect(active(current).focused).toBe(paneId);
  return current;
}

function dimCells(surface: Surface): number {
  let dim = 0;
  for (let y = 0; y < surface.height; y += 1) {
    for (let x = 0; x < surface.width; x += 1) {
      if (surface.get(x, y).modifiers?.includes('dim') === true) dim += 1;
    }
  }
  return dim;
}

describe('DOGFOOD contextual drawer focus', () => {
  it('is closed by default in every layout variant', () => {
    for (const [columns, rows] of [[140, 40], [100, 30], [70, 20], [50, 12]] as const) {
      const { model } = boot(columns, rows);
      expect(active(model).page.contextDrawer.open).toBe(false);
      expect(active(model).focused).not.toBe(CONTEXT_DRAWER_PANE_ID);
    }
  });

  it('opens into focus and restores the captured pane on Esc or the toggle key', () => {
    const { run, model } = boot(140, 40);
    const onContent = focusPane(run, model, 'story-content');
    const opened = run(onContent, [key('i')]);
    expect(active(opened).page.contextDrawer).toEqual({ open: true, kind: 'story-variants', restorePaneId: 'story-content' });
    expect(active(opened).focused).toBe(CONTEXT_DRAWER_PANE_ID);
    const escaped = run(opened, [key('escape')]);
    expect(active(escaped).page.contextDrawer.open).toBe(false);
    expect(active(escaped).focused).toBe('story-content');
    expect(escaped.docsModel.quitConfirmOpen).toBe(false);
    const toggled = run(onContent, [key('i'), key('i')]);
    expect(active(toggled).page.contextDrawer.open).toBe(false);
    expect(active(toggled).focused).toBe('story-content');
  });

  it('works on a guide page in the narrow layout', () => {
    const { run, model } = boot(70, 20, 'guides');
    const opened = run(model, [key('i')]);
    expect(active(opened).page.contextDrawer.kind).toBe('guide-meta');
    expect(active(opened).focused).toBe(CONTEXT_DRAWER_PANE_ID);
    expect(active(run(opened, [key('escape')])).focused).toBe('guide-nav');
  });

  it('restores the captured pane after focus leaves the drawer before toggle close', () => {
    const { run, model } = boot(140, 40);
    const onFamily = focusPane(run, model, 'family-nav');
    const opened = run(onFamily, [key('i')]);
    const onContent = focusPane(run, opened, 'story-content');
    expect(active(onContent).page.contextDrawer.open).toBe(true);
    const closed = run(onContent, [key('i')]);
    expect(active(closed).page.contextDrawer.open).toBe(false);
    expect(active(closed).focused).toBe('family-nav');
  });

  it('restores to the primary content pane when a resize hid the captured pane', () => {
    const { run, model } = boot(140, 40);
    const onFamily = focusPane(run, model, 'family-nav');
    const closed = run(onFamily, [key('i'), resize(50, 12), key('escape')]);
    expect(active(closed).page.contextDrawer.open).toBe(false);
    expect(active(closed).focused).toBe('story-content');
  });

  it('leaves frame overlays first in the routing order and closes on page change', () => {
    const { run, model } = boot(140, 40);
    const withHelp = run(model, [key('?'), key('i')]);
    expect(active(withHelp).page.contextDrawer.open).toBe(false);
    const switched = run(model, [key('i'), key(']')]);
    expect(Object.values(switched.docsModel.pageModels).some((page) => page.contextDrawer.open)).toBe(false);
  });

  it('keeps focus on a visible pane through random open, close, resize and pane switches', () => {
    const steps: readonly Step[] = [
      key('i'), key('escape'), key('tab'), key('tab', true), key(']'), key('['),
      resize(140, 40), resize(100, 30), resize(70, 20), resize(50, 12),
    ];
    const { run, model } = boot(140, 40);
    fc.assert(fc.property(fc.array(fc.constantFrom(...steps), { maxLength: 24 }), (sequence) => {
      let current = model;
      for (const step of sequence) {
        current = run(current, [step]);
        const { pageId, page, focused } = active(current);
        expect(docsShellPaneIds(pageId, page.layoutVariant, page.contextDrawer.open)).toContain(focused);
        expect(page.contextDrawer.restorePaneId).not.toBe(CONTEXT_DRAWER_PANE_ID);
      }
    }), { numRuns: 60, seed: 627 });
  });

  it('does not dim the frame while only the drawer is open', async () => {
    const frameAfter = async (keys: readonly string[]) => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 140, rows: 40 } });
      const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'components' });
      const result = await runScript(app, keys.map((k) => ({ key: k })), { ctx });
      const frame = result.frames.at(-1);
      if (frame === undefined) throw new Error('Missing frame.');
      return frame;
    };
    const closed = dimCells(await frameAfter(['\t']));
    expect(dimCells(await frameAfter(['\t', 'i']))).toBe(closed);
    // Positive control: a real Overlay (help) does dim the frame behind it.
    expect(dimCells(await frameAfter(['?']))).toBeGreaterThan(closed);
  });
});
