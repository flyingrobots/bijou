import { describe, expect, it } from 'vitest';
import { stripAnsi, surfaceToString } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { createDocsApp, resolveDocsLayoutVariant } from '../../../examples/docs/app.js';
import { normalizeViewOutput } from '../../../packages/bijou-tui/src/view-output.js';
import { readRepoFile } from '../repo.js';

const ENTER = { type: 'key', key: 'enter', ctrl: false, alt: false, shift: false } as const;
const NEXT_TAB = { type: 'key', key: ']', ctrl: false, alt: false, shift: false } as const;
type DocsRootModel = ReturnType<ReturnType<typeof createDocsApp>['init']>[0];

function renderEnteredDocs(columns: number, rows: number, openComponents = false) {
  const ctx = createTestContext({ mode: 'interactive', runtime: { columns, rows } });
  const app = createDocsApp(ctx);
  let [model] = app.init();
  [model] = app.update(ENTER, model);
  if (openComponents) {
    [model] = app.update(NEXT_TAB, model);
  }
  const surface = normalizeViewOutput(app.view(model), { width: columns, height: rows }).surface;
  return {
    app,
    ctx,
    model,
    surface,
    text: stripAnsi(surfaceToString(surface, ctx.style)),
  };
}

function activePageModel(model: DocsRootModel) {
  return model.docsModel.pageModels[model.docsModel.activePageId];
}

describe('DF-067 responsive DOGFOOD layout variants', () => {
  it('keeps the active cycle doc tied to the playback contract', () => {
    const cycle = readRepoFile('docs/design/DF-067-prove-responsive-dogfood-layout-variants.md');

    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });

  it('classifies docs layout variants from terminal size', () => {
    expect(resolveDocsLayoutVariant(140, 40)).toBe('wide');
    expect(resolveDocsLayoutVariant(100, 30)).toBe('standard');
    expect(resolveDocsLayoutVariant(72, 20)).toBe('narrow');
    expect(resolveDocsLayoutVariant(50, 14)).toBe('tiny');
  });

  it('keeps guide pages useful across wide, standard, narrow, and tiny layouts', () => {
    const wide = renderEnteredDocs(140, 40);
    expect(activePageModel(wide.model).layoutVariant).toBe('wide');
    expect(wide.text).toContain('docs • Start Here');
    expect(wide.text).toContain('section • guides');
    expect(wide.text).toContain('Current selection');

    const standard = renderEnteredDocs(100, 30);
    expect(activePageModel(standard.model).layoutVariant).toBe('standard');
    expect(standard.text).toContain('guides');
    expect(standard.text).toContain('docs • Start Here');
    expect(standard.text).toContain('Bijou is');
    expect(standard.text).not.toContain('Current selection');

    const narrow = renderEnteredDocs(72, 20);
    expect(activePageModel(narrow.model).layoutVariant).toBe('narrow');
    expect(narrow.text).toContain('Navigate DOGFOOD');
    expect(narrow.text).toContain('Start Here');
    expect(narrow.text).toContain('Bijou is');
    expect(narrow.text).not.toContain('Current selection');

    const tiny = renderEnteredDocs(50, 14);
    expect(activePageModel(tiny.model).layoutVariant).toBe('tiny');
    expect(tiny.text).toContain('Start Here');
    expect(tiny.text).toContain('Bijou is');
    expect(tiny.text).not.toContain('Navigate DOGFOOD');
    expect(tiny.text).not.toContain('Documentation Map');
    expect(tiny.text).not.toContain('Current selection');
  });

  it('keeps the component explorer from becoming a crushed three-column surface', () => {
    const wide = renderEnteredDocs(140, 40, true);
    expect(activePageModel(wide.model).layoutVariant).toBe('wide');
    expect(wide.text).toContain('component families');
    expect(wide.text).toContain('What is Bijou?');
    expect(wide.text).toContain('variants');

    const narrow = renderEnteredDocs(72, 20, true);
    expect(activePageModel(narrow.model).layoutVariant).toBe('narrow');
    expect(narrow.text).toContain('component families');
    expect(narrow.text).toContain('What is Bijou?');
    expect(narrow.text).not.toContain('variants');

    const tiny = renderEnteredDocs(50, 14, true);
    expect(activePageModel(tiny.model).layoutVariant).toBe('tiny');
    expect(tiny.text).toContain('What is Bijou?');
    expect(tiny.text).not.toContain('component families');
    expect(tiny.text).not.toContain('variants');
  });

  it('updates the layout variant and useful pane shape during live resize', () => {
    const { app, ctx, model: initialModel } = renderEnteredDocs(140, 40);
    let model = initialModel;

    expect(activePageModel(model).layoutVariant).toBe('wide');

    [model] = app.update({ type: 'resize', columns: 50, rows: 14 }, model);
    const surface = normalizeViewOutput(app.view(model), { width: 50, height: 14 }).surface;
    const text = stripAnsi(surfaceToString(surface, ctx.style));

    expect(surface.width).toBe(50);
    expect(surface.height).toBe(14);
    expect(activePageModel(model).layoutVariant).toBe('tiny');
    expect(text).toContain('Start Here');
    expect(text).toContain('Bijou is');
    expect(text).not.toContain('Navigate DOGFOOD');
    expect(text).not.toContain('Current selection');
  });
});
