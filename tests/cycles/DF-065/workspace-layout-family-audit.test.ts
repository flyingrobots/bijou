import { afterEach, describe, expect, it } from 'vitest';
import { stripAnsi, surfaceToString, type OutputMode } from '@flyingrobots/bijou';
import { _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  createStoryProfileContext,
  storyPreviewSurface,
} from '../../../examples/_stories/protocol.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';
import { readRepoFile } from '../repo.js';

const WORKSPACE_LAYOUT_STORY_ID = 'workspace-layout';
const EXPECTED_VARIANT_IDS = ['split-context', 'dashboard-grid'] as const;
const VISUAL_MODES: readonly OutputMode[] = ['interactive', 'static'];
const CONSTRAINED_MODES: readonly OutputMode[] = ['pipe', 'accessible'];
const BOX_DRAWING_RE = /[┌┐└┘─│]/;

function getWorkspaceLayoutStory() {
  const story = COMPONENT_STORIES.find((candidate) => candidate.id === WORKSPACE_LAYOUT_STORY_ID);
  expect(story).toBeDefined();
  return story!;
}

function renderWorkspaceLayoutVariantText(variantId: string, mode: OutputMode): string {
  const story = getWorkspaceLayoutStory();
  const variant = story.variants.find((candidate) => candidate.id === variantId);
  expect(variant).toBeDefined();

  const preset = story.profilePresets.find((candidate) => candidate.mode === mode);
  expect(preset).toBeDefined();

  const baseCtx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
  const previewCtx = createStoryProfileContext(baseCtx, preset!, {
    width: preset!.width,
    height: 18,
  });
  const preview = storyPreviewSurface(variant!.render({
    width: preset!.width,
    ctx: previewCtx,
    state: variant!.initialState,
    timeMs: 0,
  }));

  return stripAnsi(surfaceToString(preview, baseCtx.style));
}

describe('DF-065 workspace layout family audit', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('keeps the active cycle doc tied to the playback contract', () => {
    const cycle = readRepoFile('docs/design/DF-065-audit-workspace-layout-family-across-real-surfaces.md');

    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });

  it('represents workspace layout in the DOGFOOD story catalog', () => {
    const story = getWorkspaceLayoutStory();

    expect(story.coverageFamilyIds).toContain('workspace-layout');
    expect(story.family).toBe('Shell and workspace');
    expect(story.title).toBe('splitPaneSurface() / gridSurface()');
    expect(story.package).toBe('bijou-tui');
    expect(story.docs.relatedFamilies).toEqual(expect.arrayContaining([
      'createFramedApp()',
      'box()',
      'focusAreaSurface()',
    ]));
    expect(story.docs.summary).toMatch(/spatial composition|simultaneous context/i);
    expect(story.variants.map((variant) => variant.id)).toEqual(EXPECTED_VARIANT_IDS);
  });

  it('renders every workspace layout variant in every documented profile', () => {
    for (const variantId of EXPECTED_VARIANT_IDS) {
      for (const mode of ['interactive', 'static', 'pipe', 'accessible'] as const) {
        const text = renderWorkspaceLayoutVariantText(variantId, mode);
        expect(text.trim().length, `${variantId}/${mode}`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps visual workspace geometry out of constrained lowerings', () => {
    for (const variantId of EXPECTED_VARIANT_IDS) {
      for (const mode of VISUAL_MODES) {
        const text = renderWorkspaceLayoutVariantText(variantId, mode);
        expect(text, `${variantId}/${mode}`).toMatch(BOX_DRAWING_RE);
      }

      for (const mode of CONSTRAINED_MODES) {
        const text = renderWorkspaceLayoutVariantText(variantId, mode);
        expect(text, `${variantId}/${mode}`).not.toMatch(BOX_DRAWING_RE);
      }
    }
  });

  it('preserves split workspace region identity in constrained lowerings', () => {
    const pipe = renderWorkspaceLayoutVariantText('split-context', 'pipe');
    const accessible = renderWorkspaceLayoutVariantText('split-context', 'accessible');

    for (const text of [pipe, accessible]) {
      expect(text).toContain('split workspace');
      expect(text).toContain('Files');
      expect(text).toContain('Editor');
    }
  });

  it('preserves grid workspace region identity in constrained lowerings', () => {
    const pipe = renderWorkspaceLayoutVariantText('dashboard-grid', 'pipe');
    const accessible = renderWorkspaceLayoutVariantText('dashboard-grid', 'accessible');

    for (const text of [pipe, accessible]) {
      expect(text).toContain('grid workspace');
      expect(text).toContain('Header');
      expect(text).toContain('Navigation');
      expect(text).toContain('Logs');
      expect(text).toContain('Main view');
    }
  });

  it('keeps component-family guidance aligned with workspace layout runtime truth', () => {
    const families = readRepoFile('docs/design-system/component-families.md');

    expect(families).toContain('### Workspace layout');
    expect(families).toContain('- `splitPane()`');
    expect(families).toContain('- `splitPaneSurface()`');
    expect(families).toContain('- `grid()`');
    expect(families).toContain('- `gridSurface()`');
    expect(families).toContain('- `flex()`');
    expect(families).toContain('- `vstack()`');
    expect(families).toContain('- `hstack()`');
    expect(families).toContain('- `place()`');
    expect(families).toContain('spatial arrangement materially helps the task');
    expect(families).toContain('sequential flow would be simpler');
    expect(families).toContain('use `splitPaneSurface()`');
    expect(families).toContain('use `gridSurface()`');
    expect(families).toContain('use `flex()` / `vstackSurface()` / `hstackSurface()` / `placeSurface()`');
    expect(families).toContain('pipe: lower to sensible sequential content order');
    expect(families).toContain('accessible: linearize regions in a predictable reading order');
  });
});
