import { describe, expect, it } from 'vitest';
import { storyCaptureMatrixText, stripAnsi, surfaceToString } from '@flyingrobots/bijou';
import { createTestContext, must } from '@flyingrobots/bijou/adapters/test';
import {
  createStorybookApp,
  createStorybookFrameApp,
  selectedStorybookStory,
  type StorybookModel,
} from '../../../examples/docs/storybook-app.js';
import {
  captureDogfoodStorybookMatrix,
  createDogfoodStorybookWorkbenchModel,
  renderDogfoodStorybookIndex,
} from '../../../examples/docs/storybook-workstation.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';
import { runScript } from '../../../packages/bijou-tui/src/driver.js';
import { normalizeViewOutput } from '../../../packages/bijou-tui/src/view-output.js';
import { readRepoFile } from '../repo.js';

const KEY_UP = '\x1b[A';
const KEY_DOWN = '\x1b[B';
type StorybookFrameModel = ReturnType<ReturnType<typeof createStorybookFrameApp>['init']>[0];
function storybookPageModel(model: StorybookFrameModel): StorybookModel { return must(model.pageModels.storybook); }

describe('DF-027 BlockLab DOGFOOD workstation', () => {
  it('keeps the active cycle doc tied to the playback contract', () => {
    const cycle = readRepoFile('docs/design/DF-027-storybook-style-tool-for-bijou.md');

    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });

  it('builds a grouped workstation model from the canonical DOGFOOD story catalog', () => {
    const model = createDogfoodStorybookWorkbenchModel();
    const familyStoryCount = model.families.reduce((total, family) => total + family.stories.length, 0);

    expect(model.title).toBe('Bijou BlockLab Workstation');
    expect(model.storyCount).toBe(COMPONENT_STORIES.length);
    expect(familyStoryCount).toBe(COMPONENT_STORIES.length);
    expect(model.variantCount).toBe(COMPONENT_STORIES.reduce((total, story) => total + story.variants.length, 0));
    expect(model.requiredModes).toEqual(['interactive', 'static', 'pipe', 'accessible']);
    expect(model.families.some((family) => family.label === 'Feedback overlays and history')).toBe(true);
    expect(model.families.flatMap((family) => family.stories).some((story) => story.id === 'notification-system')).toBe(true);
  });

  it('renders a deterministic BlockLab index for humans and agents', () => {
    const index = renderDogfoodStorybookIndex();
    expect(index).toContain('# Bijou BlockLab Workstation');
    expect(index).toContain(`Stories: ${String(COMPONENT_STORIES.length)}`);
    expect(index).toContain('Required modes: interactive, static, pipe, accessible');
    expect(index).toContain('## Feedback overlays and history');
    expect(index).toContain('- notification-system');
    expect(index).toContain('package:bijou-tui');
    expect(index).toContain('variants:live-stack,history-review,framed-routing');
    expect(index).toContain('modes:interactive,static,pipe,accessible');
    expect(index).toContain('source:examples/notifications/main.ts');
  });
  it('captures a selected story across every profile and variant', () => {
    const matrix = captureDogfoodStorybookMatrix({ storyId: 'notification-system' });
    const story = COMPONENT_STORIES.find((candidate) => candidate.id === 'notification-system');
    expect(story).toBeDefined();
    expect(matrix.storyId).toBe('notification-system');
    expect(matrix.title).toBe(story?.title);
    expect(matrix.missingModes).toEqual([]);
    expect(matrix.captures).toHaveLength(must(story).profilePresets.length * must(story).variants.length);
    expect(matrix.captures.some((capture) => (
      capture.profileId === 'pipe'
      && capture.variantId === 'framed-routing'
      && capture.output.includes('frame runtime notifications')
    ))).toBe(true);
    const text = storyCaptureMatrixText(matrix);
    expect(text).toContain('story capture matrix: notification-system');
    expect(text).toContain('variant framed-routing (Framed routing)');
    expect(text).toContain('Footer cue: notices:2');
  });
  it('registers the text-first workstation commands', () => {
    const packageJson = readRepoFile('package.json');
    expect(packageJson).toContain('"blocklab:index": "tsx examples/docs/storybook-workstation.ts"');
    expect(packageJson).toContain('"storybook:index": "tsx examples/docs/storybook-workstation.ts"');
    expect(packageJson).toContain('"dogfood:storybook": "tsx examples/docs/storybook-workstation.ts"');
  });
  it('registers the interactive story browser command', () => {
    const packageJson = readRepoFile('package.json');
    const entrypoint = readRepoFile('examples/docs/storybook.ts');
    expect(packageJson).toContain('"blocklab": "node --import tsx examples/docs/storybook.ts"');
    expect(packageJson).toContain('"storybook": "node --import tsx examples/docs/storybook.ts"');
    expect(entrypoint).toContain('createBlockLabFrameApp');
    expect(entrypoint).not.toContain('createDocsApp');
  });
  it('can start a standalone interactive BlockLab workbench', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createStorybookApp(ctx, { initialStoryId: 'notification-system' });
    const [model] = app.init();
    const surface = normalizeViewOutput(app.view(model), { width: 120, height: 40 }).surface;
    const text = stripAnsi(surfaceToString(surface, ctx.style));
    expect(selectedStorybookStory(model).id).toBe('notification-system');
    expect('route' in model).toBe(false);
    expect('docsModel' in model).toBe(false);
    expect(text).toContain('Bijou BlockLab');
    expect(text).toContain('notification-system');
    expect(text).toContain('test matrix');
    expect(text).toContain('all required modes');
    expect(text).not.toContain('Press [Enter]');
  });
  it('runs the interactive Storybook entrypoint through the AppFrame shell', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createStorybookFrameApp(ctx, { initialStoryId: 'notification-system' });
    const [model] = app.init();
    const pageModel = storybookPageModel(model);
    const surface = normalizeViewOutput(app.view(model), { width: 120, height: 40 }).surface;
    const text = stripAnsi(surfaceToString(surface, ctx.style));
    expect(model.activePageId).toBe('storybook');
    expect(selectedStorybookStory(pageModel).id).toBe('notification-system');
    expect(text).toContain('Bijou BlockLab');
    expect(text).toContain('BlockLab');
    expect(text).toContain('notification-system');
  });
  it('lets framed BlockLab navigation keys move the selected story', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    for (const key of [KEY_DOWN, 'j']) {
      const app = createStorybookFrameApp(ctx);
      const [initialModel] = app.init();
      const initialPageModel = storybookPageModel(initialModel);
      const before = selectedStorybookStory(initialPageModel).id;
      const result = await runScript(app, [{ key }], { ctx, pulseFps: false });
      const pageModel = storybookPageModel(result.model);
      const after = selectedStorybookStory(pageModel).id;
      expect(before).toBe('alert');
      expect(after).not.toBe(before);
      expect(after).toBe('badge');
    }
    for (const key of [KEY_UP, 'k']) {
      const app = createStorybookFrameApp(ctx, { initialStoryId: 'badge' });
      const [initialModel] = app.init();
      const initialPageModel = storybookPageModel(initialModel);
      const before = selectedStorybookStory(initialPageModel).id;
      const result = await runScript(app, [{ key }], { ctx, pulseFps: false });
      const pageModel = storybookPageModel(result.model);
      const after = selectedStorybookStory(pageModel).id;
      expect(before).toBe('badge');
      expect(after).not.toBe(before);
      expect(after).toBe('alert');
    }
  });
});
