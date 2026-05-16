import { afterEach, describe, expect, it } from 'vitest';
import { stripAnsi, surfaceToString, type OutputMode } from '@flyingrobots/bijou';
import { _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  createStoryProfileContext,
  storyPreviewSurface,
} from '../../../examples/_stories/protocol.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';
import { readRepoFile } from '../repo.js';

const INSPECTOR_STORY_ID = 'inspector';
const EXPECTED_VARIANT_IDS = ['package-summary', 'rollout-review'] as const;
const VISUAL_MODES: readonly OutputMode[] = ['interactive', 'static'];
const CONSTRAINED_MODES: readonly OutputMode[] = ['pipe', 'accessible'];
const BOX_DRAWING_RE = /[┌┐└┘─│]/;

function getInspectorStory() {
  const story = COMPONENT_STORIES.find((candidate) => candidate.id === INSPECTOR_STORY_ID);
  expect(story).toBeDefined();
  return story!;
}

function renderInspectorVariantText(variantId: string, mode: OutputMode): string {
  const story = getInspectorStory();
  const variant = story.variants.find((candidate) => candidate.id === variantId);
  expect(variant).toBeDefined();

  const preset = story.profilePresets.find((candidate) => candidate.mode === mode);
  expect(preset).toBeDefined();

  const baseCtx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
  const previewCtx = createStoryProfileContext(baseCtx, preset!, {
    width: preset!.width,
    height: 20,
  });
  const preview = storyPreviewSurface(variant!.render({
    width: preset!.width,
    ctx: previewCtx,
    state: variant!.initialState as never,
    timeMs: 0,
  }));

  return stripAnsi(surfaceToString(preview, baseCtx.style));
}

describe('DF-041 inspector panels family audit', () => {
  afterEach(() => _resetDefaultContextForTesting());

  it('keeps the active cycle doc tied to the playback contract', () => {
    const cycle = readRepoFile('docs/design/DF-041-audit-inspector-panels-family-across-real-surfaces.md');

    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });

  it('represents inspector panels in the DOGFOOD story catalog', () => {
    const story = getInspectorStory();

    expect(story.coverageFamilyIds).toContain('inspector-panels');
    expect(story.title).toBe('inspector()');
    expect(story.docs.relatedFamilies).toEqual(expect.arrayContaining([
      'box()',
      'explainability()',
      'preferenceListSurface()',
    ]));
    expect(story.docs.summary).toMatch(/side-panel|selected/i);
    expect(story.variants.map((variant) => variant.id)).toEqual(EXPECTED_VARIANT_IDS);
  });

  it('renders every inspector variant in every documented profile', () => {
    for (const variantId of EXPECTED_VARIANT_IDS) {
      for (const mode of ['interactive', 'static', 'pipe', 'accessible'] as const) {
        const text = renderInspectorVariantText(variantId, mode);
        expect(text.trim().length, `${variantId}/${mode}`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps titled containment in visual profiles only', () => {
    for (const variantId of EXPECTED_VARIANT_IDS) {
      for (const mode of VISUAL_MODES) {
        const text = renderInspectorVariantText(variantId, mode);
        expect(text, `${variantId}/${mode}`).toMatch(BOX_DRAWING_RE);
      }

      for (const mode of CONSTRAINED_MODES) {
        const text = renderInspectorVariantText(variantId, mode);
        expect(text, `${variantId}/${mode}`).not.toMatch(BOX_DRAWING_RE);
      }
    }
  });

  it('preserves inspector semantics in constrained lowerings', () => {
    const packagePipe = renderInspectorVariantText('package-summary', 'pipe');
    const rolloutPipe = renderInspectorVariantText('rollout-review', 'pipe');
    const packageAccessible = renderInspectorVariantText('package-summary', 'accessible');
    const rolloutAccessible = renderInspectorVariantText('rollout-review', 'accessible');

    expect(packagePipe).toMatch(/Current selection: release-control/);
    expect(packagePipe).toMatch(/Context:/);
    expect(packagePipe).toMatch(/Owner:|Profile:|Description:/);
    expect(rolloutPipe).toMatch(/Current selection: canary-eu-west/);
    expect(rolloutPipe).toMatch(/Health:|ETA:|Description:/);
    expect(packageAccessible).toContain('Inspector: package summary');
    expect(rolloutAccessible).toContain('Inspector: active rollout');
  });

  it('keeps component-family guidance aligned with inspector runtime truth', () => {
    const families = readRepoFile('docs/design-system/component-families.md');

    expect(families).toContain('### Inspector panels');
    expect(families).toContain('- Family: `inspector()`');
    expect(families).toContain('current-selection emphasis');
    expect(families).toContain('compact titled sections');
    expect(families).toContain('the panel needs one obvious current value');
    expect(families).toContain('pipe: lower to explicit field labels');
    expect(families).toContain('accessible: linearize the same fields');
  });
});
