import { afterEach, describe, expect, it } from 'vitest';
import { stripAnsi, surfaceToString, type OutputMode } from '@flyingrobots/bijou';
import { must, _resetDefaultContextForTesting, createTestContext  } from '@flyingrobots/bijou/adapters/test';
import {
  createStoryProfileContext,
  storyPreviewSurface,
} from '../../../examples/_stories/protocol.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';
import { readRepoFile } from '../repo.js';

const FORMS_STORY_ID = 'group-wizard';
const EXPECTED_VARIANT_IDS = ['deploy-group', 'rollout-wizard'] as const;
const VISUAL_MODES: readonly OutputMode[] = ['interactive', 'static'];
const CONSTRAINED_MODES: readonly OutputMode[] = ['pipe', 'accessible'];
const BOX_DRAWING_RE = /[┌┐└┘─│]/;

function getFormsStory() {
  const story = COMPONENT_STORIES.find((candidate) => candidate.id === FORMS_STORY_ID);
  expect(story).toBeDefined();
  return must(story);
}

function renderFormsVariantText(variantId: string, mode: OutputMode): string {
  const story = getFormsStory();
  const variant = story.variants.find((candidate) => candidate.id === variantId);
  expect(variant).toBeDefined();

  const preset = story.profilePresets.find((candidate) => candidate.mode === mode);
  expect(preset).toBeDefined();

  const baseCtx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
  const previewCtx = createStoryProfileContext(baseCtx, must(preset), {
    width: must(preset).width,
    height: 18,
  });
  const preview = storyPreviewSurface(must(variant).render({
    width: must(preset).width,
    ctx: previewCtx,
    state: must(variant).initialState,
    timeMs: 0,
  }));

  return stripAnsi(surfaceToString(preview, baseCtx.style));
}

describe('DF-049 multi-field and staged forms family audit', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('keeps the active cycle doc tied to the playback contract', () => {
    const cycle = readRepoFile('docs/design/DF-049-audit-multi-field-and-staged-forms-family-across-real-surfaces.md');

    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });

  it('represents multi-field and staged forms in the DOGFOOD story catalog', () => {
    const story = getFormsStory();

    expect(story.coverageFamilyIds).toContain('multi-field-and-staged-forms');
    expect(story.title).toBe('group() / wizard()');
    expect(story.docs.relatedFamilies).toEqual(expect.arrayContaining([
      'input()',
      'textarea()',
      'select()',
      'confirm()',
    ]));
    expect(story.docs.summary).toMatch(/grouped|staged|related inputs/i);
    expect(story.variants.map((variant) => variant.id)).toEqual(EXPECTED_VARIANT_IDS);
  });

  it('renders every forms variant in every documented profile', () => {
    for (const variantId of EXPECTED_VARIANT_IDS) {
      for (const mode of ['interactive', 'static', 'pipe', 'accessible'] as const) {
        const text = renderFormsVariantText(variantId, mode);
        expect(text.trim().length, `${variantId}/${mode}`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps visual containment out of constrained lowerings', () => {
    for (const variantId of EXPECTED_VARIANT_IDS) {
      for (const mode of VISUAL_MODES) {
        const text = renderFormsVariantText(variantId, mode);
        expect(text, `${variantId}/${mode}`).toMatch(BOX_DRAWING_RE);
      }

      for (const mode of CONSTRAINED_MODES) {
        const text = renderFormsVariantText(variantId, mode);
        expect(text, `${variantId}/${mode}`).not.toMatch(BOX_DRAWING_RE);
      }
    }
  });

  it('preserves grouped form semantics in constrained lowerings', () => {
    const groupPipe = renderFormsVariantText('deploy-group', 'pipe');
    const groupAccessible = renderFormsVariantText('deploy-group', 'accessible');

    expect(groupPipe).toContain('Prepare a production deploy:');
    expect(groupPipe).toContain('Environment:');
    expect(groupPipe).toContain('production');
    expect(groupPipe).toContain('Window:');
    expect(groupPipe).toContain('Tonight, 17:00-18:00 PDT');
    expect(groupPipe).toContain('Summary: Use grouped forms');
    expect(groupAccessible).toContain('Environment: production');
    expect(groupAccessible).toContain('Approver: Release manager on call');
    expect(groupAccessible).toContain('Summary: Use grouped forms');
  });

  it('preserves staged wizard progress in constrained lowerings', () => {
    const wizardPipe = renderFormsVariantText('rollout-wizard', 'pipe');
    const wizardAccessible = renderFormsVariantText('rollout-wizard', 'accessible');

    expect(wizardPipe).toContain('Plan the rollout:');
    expect(wizardPipe).toMatch(/Step 2 of 3.*Verification/);
    expect(wizardPipe).toContain('Health threshold:');
    expect(wizardPipe).toContain('0 failed probes for 10m');
    expect(wizardPipe).toContain('Fallback owner:');
    expect(wizardPipe).toContain('Summary: Use staged forms');
    expect(wizardAccessible).toContain('Current step: Step 2 of 3');
    expect(wizardAccessible).toContain('Health threshold: 0 failed probes for 10m');
    expect(wizardAccessible).toContain('Fallback owner: platform-ops');
  });

  it('keeps component-family guidance aligned with forms runtime truth', () => {
    const families = readRepoFile('docs/design-system/component-families.md');

    expect(families).toContain('### Multi-field and staged forms');
    expect(families).toContain('- `group()`');
    expect(families).toContain('- `wizard()`');
    expect(families).toContain('single-step grouped form');
    expect(families).toContain('staged or branching flow');
    expect(families).toContain('each step or group should have a clear goal');
    expect(families).toContain('summaries and progress text should orient the user');
    expect(families).toContain('pipe: lower to sequential prompts');
    expect(families).toContain('accessible: keep step names, requirements, and progress explicit');
  });
});
