import { afterEach, describe, expect, it } from 'vitest';
import { stripAnsi, surfaceToString, type OutputMode } from '@flyingrobots/bijou';
import { _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  createStoryProfileContext,
  storyPreviewSurface,
} from '../../../examples/_stories/protocol.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';
import { readRepoFile } from '../repo.js';

const SKELETON_STORY_ID = 'skeleton';
const EXPECTED_VARIANT_IDS = ['form-shell', 'card-region'] as const;
const VISUAL_MODES: readonly OutputMode[] = ['interactive', 'static'];
const CONSTRAINED_MODES: readonly OutputMode[] = ['pipe', 'accessible'];

function getSkeletonStory() {
  const story = COMPONENT_STORIES.find((candidate) => candidate.id === SKELETON_STORY_ID);
  expect(story).toBeDefined();
  return story!;
}

function renderSkeletonVariantText(variantId: string, mode: OutputMode): string {
  const story = getSkeletonStory();
  const variant = story.variants.find((candidate) => candidate.id === variantId);
  expect(variant).toBeDefined();

  const preset = story.profilePresets.find((candidate) => candidate.mode === mode);
  expect(preset).toBeDefined();

  const baseCtx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
  const previewCtx = createStoryProfileContext(baseCtx, preset!, {
    width: preset!.width,
    height: 14,
  });
  const preview = storyPreviewSurface(variant!.render({
    width: preset!.width,
    ctx: previewCtx,
    state: variant!.initialState as never,
    timeMs: 0,
  }));

  return stripAnsi(surfaceToString(preview, baseCtx.style));
}

describe('DF-036 loading placeholders family audit', () => {
  afterEach(() => _resetDefaultContextForTesting());

  it('keeps the active cycle doc tied to the playback contract', () => {
    const cycle = readRepoFile('docs/design/DF-036-audit-loading-placeholders-family-across-real-surfaces.md');

    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });

  it('represents loading placeholders in the DOGFOOD story catalog', () => {
    const story = getSkeletonStory();

    expect(story.coverageFamilyIds).toContain('loading-placeholders');
    expect(story.title).toBe('skeleton()');
    expect(story.docs.relatedFamilies).toEqual(expect.arrayContaining([
      'progressBar()',
      'spinnerFrame()',
      'note()',
    ]));
    expect(story.docs.summary).toMatch(/known|shape|loading/i);
    expect(story.variants.map((variant) => variant.id)).toEqual(EXPECTED_VARIANT_IDS);
  });

  it('renders every skeleton variant in every documented profile', () => {
    for (const variantId of EXPECTED_VARIANT_IDS) {
      for (const mode of ['interactive', 'static', 'pipe', 'accessible'] as const) {
        const text = renderSkeletonVariantText(variantId, mode);
        expect(text.trim().length, `${variantId}/${mode}`).toBeGreaterThan(0);
      }
    }
  });

  it('preserves placeholder shape only in visual profiles', () => {
    for (const variantId of EXPECTED_VARIANT_IDS) {
      for (const mode of VISUAL_MODES) {
        const text = renderSkeletonVariantText(variantId, mode);
        expect(text, `${variantId}/${mode}`).toContain('░');
      }

      for (const mode of CONSTRAINED_MODES) {
        const text = renderSkeletonVariantText(variantId, mode);
        expect(text, `${variantId}/${mode}`).not.toContain('░');
      }
    }
  });

  it('keeps constrained lowerings meaningful without decorative bars', () => {
    const formPipe = renderSkeletonVariantText('form-shell', 'pipe');
    const cardPipe = renderSkeletonVariantText('card-region', 'pipe');

    expect(formPipe).toMatch(/Name|Description|Owner/);
    expect(cardPipe).toMatch(/Package summary|Recent activity/);
    expect(renderSkeletonVariantText('form-shell', 'accessible')).toContain('Loading...');
    expect(renderSkeletonVariantText('card-region', 'accessible')).toContain('Loading...');
  });

  it('keeps component-family guidance aligned with skeleton runtime truth', () => {
    const families = readRepoFile('docs/design-system/component-families.md');

    expect(families).toContain('### Loading placeholders');
    expect(families).toContain('- Family: `skeleton()`');
    expect(families).toContain('single-line, multiline, and region-shaped placeholders');
    expect(families).toContain('the expected content shape is known');
    expect(families).toContain('short-lived loading interval');
    expect(families).toContain('pipe: lower to explicit loading text or field labels');
    expect(families).toContain('accessible: announce loading state');
  });
});
