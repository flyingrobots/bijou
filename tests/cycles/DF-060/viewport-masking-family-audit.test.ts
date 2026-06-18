import { afterEach, describe, expect, it } from 'vitest';
import { stripAnsi, surfaceToString, type OutputMode } from '@flyingrobots/bijou';
import { _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  createStoryProfileContext,
  storyPreviewSurface,
} from '../../../examples/_stories/protocol.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';
import { readRepoFile } from '../repo.js';

const VIEWPORT_STORY_ID = 'viewport-surface';
const EXPECTED_VARIANT_IDS = ['document', 'structured-stack', 'pager-window', 'focused-pane'] as const;
const VISUAL_MODES: readonly OutputMode[] = ['interactive', 'static'];
const CONSTRAINED_MODES: readonly OutputMode[] = ['pipe', 'accessible'];
const BOX_DRAWING_RE = /[┌┐└┘─│]/;

function getViewportStory() {
  const story = COMPONENT_STORIES.find((candidate) => candidate.id === VIEWPORT_STORY_ID);
  expect(story).toBeDefined();
  return story!;
}

function renderViewportVariantText(variantId: string, mode: OutputMode): string {
  const story = getViewportStory();
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

describe('DF-060 viewport masking and scrollable inspection panes family audit', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('keeps the active cycle doc tied to the playback contract', () => {
    const cycle = readRepoFile('docs/design/DF-060-audit-viewport-masking-and-scrollable-inspection-panes-family-across-real-surfaces.md');

    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });

  it('represents viewport masking in the DOGFOOD story catalog', () => {
    const story = getViewportStory();

    expect(story.coverageFamilyIds).toContain('viewport-masking-and-scrollable-inspection-panes');
    expect(story.family).toBe('Masking and overflow');
    expect(story.title).toBe('viewportSurface() / pagerSurface() / focusAreaSurface()');
    expect(story.package).toBe('bijou-tui');
    expect(story.docs.relatedFamilies).toEqual(expect.arrayContaining([
      'pagerSurface()',
      'focusAreaSurface()',
      'navigableTableSurface()',
    ]));
    expect(story.docs.summary).toMatch(/masking|scrollable-pane|bounded overflow/i);
    expect(story.variants.map((variant) => variant.id)).toEqual(EXPECTED_VARIANT_IDS);
  });

  it('renders every viewport family variant in every documented profile', () => {
    for (const variantId of EXPECTED_VARIANT_IDS) {
      for (const mode of ['interactive', 'static', 'pipe', 'accessible'] as const) {
        const text = renderViewportVariantText(variantId, mode);
        expect(text.trim().length, `${variantId}/${mode}`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps visual scroll and pane chrome out of constrained lowerings', () => {
    for (const variantId of EXPECTED_VARIANT_IDS) {
      for (const mode of VISUAL_MODES) {
        const text = renderViewportVariantText(variantId, mode);
        expect(text, `${variantId}/${mode}`).toMatch(BOX_DRAWING_RE);
      }

      for (const mode of CONSTRAINED_MODES) {
        const text = renderViewportVariantText(variantId, mode);
        expect(text, `${variantId}/${mode}`).not.toMatch(BOX_DRAWING_RE);
      }
    }
  });

  it('preserves viewport scroll context in constrained lowerings', () => {
    const documentPipe = renderViewportVariantText('document', 'pipe');
    const structuredAccessible = renderViewportVariantText('structured-stack', 'accessible');

    expect(documentPipe).toContain('viewport mask');
    expect(documentPipe).toContain('scrollY=4');
    expect(documentPipe).toContain('release-notes.md');
    expect(documentPipe).toContain('Run migrations');
    expect(structuredAccessible).toContain('viewport mask');
    expect(structuredAccessible).toContain('scrollY=3');
    expect(structuredAccessible).toContain('Signals');
    expect(structuredAccessible).toContain('Review');
    expect(structuredAccessible).toContain('Actions');
  });

  it('preserves pager line context in constrained lowerings', () => {
    const pipe = renderViewportVariantText('pager-window', 'pipe');
    const accessible = renderViewportVariantText('pager-window', 'accessible');

    for (const text of [pipe, accessible]) {
      expect(text).toContain('pager surface');
      expect(text).toMatch(/Line \d+\/\d+/);
      expect(text).toContain('release reader');
      expect(text).toContain('Run migrations');
      expect(text).toContain('Promote release');
    }
  });

  it('preserves focus pane context in constrained lowerings', () => {
    const pipe = renderViewportVariantText('focused-pane', 'pipe');
    const accessible = renderViewportVariantText('focused-pane', 'accessible');

    for (const text of [pipe, accessible]) {
      expect(text).toContain('focused pane');
      expect(text).toContain('focused=true');
      expect(text).toContain('scrollY=2');
      expect(text).toContain('Inspector notes');
      expect(text).toContain('Warnings');
      expect(text).toContain('Actions');
    }
  });

  it('keeps component-family guidance aligned with viewport runtime truth', () => {
    const families = readRepoFile('docs/design-system/component-families.md');

    expect(families).toContain('### Viewport masking and scrollable inspection panes');
    expect(families).toContain('- `viewport()`');
    expect(families).toContain('- `viewportSurface()`');
    expect(families).toContain('- `pager()`');
    expect(families).toContain('- `pagerSurface()`');
    expect(families).toContain('- `focusArea()`');
    expect(families).toContain('- `focusAreaSurface()`');
    expect(families).toContain('pure scroll mask');
    expect(families).toContain('linear pager');
    expect(families).toContain('focused pane with gutter');
    expect(families).toContain('bounded pane is for reading, reviewing, or scrolling');
    expect(families).toContain('viewport masking is the wrong abstraction when the user thinks in semantic rows');
    expect(families).toContain('pipe: lower to sequential text');
    expect(families).toContain('accessible: linearize the pane content');
  });
});
