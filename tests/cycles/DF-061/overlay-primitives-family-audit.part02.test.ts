import { afterEach, describe, expect, it } from 'vitest';

import { stripAnsi, surfaceToString, type OutputMode } from '@flyingrobots/bijou';

import { must, _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';

import {
  createStoryProfileContext,
  storyPreviewSurface,
} from '../../../examples/_stories/protocol.js';

import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';

function getStory(storyId: string) {
  const story = COMPONENT_STORIES.find((candidate) => candidate.id === storyId);
  return must(story);
}

function renderOverlayVariantText(
  storyId: string,
  variantId: string,
  mode: OutputMode,
): string {
  const story = getStory(storyId);
  const variant = story.variants.find((candidate) => candidate.id === variantId);
  const preset = story.profilePresets.find((candidate) => candidate.mode === mode);
  const baseCtx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
  const profile = must(preset);
  const storyVariant = must(variant);
  const previewCtx = createStoryProfileContext(baseCtx, profile, {
    width: profile.width,
    height: 18,
  });
  const preview = storyPreviewSurface(storyVariant.render({
    width: profile.width,
    ctx: previewCtx,
    state: storyVariant.initialState,
    timeMs: 0,
  }));
  return stripAnsi(surfaceToString(preview, baseCtx.style));
}

describe('DF-061 overlay primitives family audit', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('preserves blocking modal prompts in constrained lowerings', () => {
    const pipe = renderOverlayVariantText('modal', 'confirm', 'pipe');
    const accessible = renderOverlayVariantText('modal', 'help', 'accessible');
    expect(pipe).toContain('modal: Confirm deploy');
    expect(pipe).toContain('Deploy release-control to production?');
    expect(pipe).toContain('Actions: y yes, n no, esc cancel');
    expect(accessible).toContain('modal: Keyboard help');
    expect(accessible).toContain('Move between stories');
    expect(accessible).toContain('return to the page');
  });
});

describe('DF-061 overlay primitives family audit', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('preserves supplemental drawer context in constrained lowerings', () => {
    const pipe = renderOverlayVariantText('drawer', 'supplemental-right', 'pipe');
    const accessible = renderOverlayVariantText('drawer', 'bottom-review', 'accessible');
    expect(pipe).toContain('drawer: Release context');
    expect(pipe).toContain('Supplemental context');
    expect(pipe).toContain('Canaries stable');
    expect(accessible).toContain('drawer: Review queue');
    expect(accessible).toContain('Supplemental review panel');
    expect(accessible).toContain('migrations waiting');
  });
});

describe('DF-061 overlay primitives family audit', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('preserves local tooltip explanation in constrained lowerings', () => {
    const pipe = renderOverlayVariantText('tooltip', 'local-explanation', 'pipe');
    const accessible = renderOverlayVariantText('tooltip', 'clamped-edge', 'accessible');
    expect(pipe).toContain('tooltip: Command palette');
    expect(pipe).toContain('Search actions and docs');
    expect(accessible).toContain('tooltip: Edge action');
    expect(accessible).toContain('Runs verification');
  });
});

describe('DF-061 overlay primitives family audit', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('preserves transient toast events in constrained lowerings', () => {
    const pipe = renderOverlayVariantText('toast', 'saved-top-right', 'pipe');
    const accessible = renderOverlayVariantText('toast', 'error-bottom-left', 'accessible');
    expect(pipe).toContain('toast: success');
    expect(pipe).toContain('Operation saved.');
    expect(accessible).toContain('toast: error');
    expect(accessible).toContain('Rollback required before promote.');
  });
});
