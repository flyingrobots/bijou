import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { storyCaptureMatrixText } from '@flyingrobots/bijou';
import {
  captureDogfoodStorybookMatrix,
  createDogfoodStorybookWorkbenchModel,
  renderDogfoodStorybookIndex,
} from '../../../examples/docs/storybook-workstation.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';
import { readRepoFile } from '../repo.js';

describe('DF-027 Storybook-style DOGFOOD workstation', () => {
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

    expect(model.title).toBe('Bijou Storybook-style Workstation');
    expect(model.storyCount).toBe(COMPONENT_STORIES.length);
    expect(familyStoryCount).toBe(COMPONENT_STORIES.length);
    expect(model.variantCount).toBe(COMPONENT_STORIES.reduce((total, story) => total + story.variants.length, 0));
    expect(model.requiredModes).toEqual(['interactive', 'static', 'pipe', 'accessible']);
    expect(model.families.some((family) => family.label === 'Feedback overlays and history')).toBe(true);
    expect(model.families.flatMap((family) => family.stories).some((story) => story.id === 'notification-system')).toBe(true);
  });

  it('renders a deterministic Storybook-style index for humans and agents', () => {
    const index = renderDogfoodStorybookIndex();

    expect(index).toContain('# Bijou Storybook-style Workstation');
    expect(index).toContain(`Stories: ${COMPONENT_STORIES.length}`);
    expect(index).toContain('Required modes: interactive, static, pipe, accessible');
    expect(index).toContain('## Feedback overlays and history');
    expect(index).toContain('- notification-system');
    expect(index).toContain('package=bijou-tui');
    expect(index).toContain('variants=live-stack,history-review,framed-routing');
    expect(index).toContain('modes=interactive,static,pipe,accessible');
    expect(index).toContain('source=examples/notifications/main.ts');
  });

  it('captures a selected story across every profile and variant', () => {
    const matrix = captureDogfoodStorybookMatrix({ storyId: 'notification-system' });
    const story = COMPONENT_STORIES.find((candidate) => candidate.id === 'notification-system');
    expect(story).toBeDefined();

    expect(matrix.storyId).toBe('notification-system');
    expect(matrix.title).toBe(story!.title);
    expect(matrix.missingModes).toEqual([]);
    expect(matrix.captures).toHaveLength(story!.profilePresets.length * story!.variants.length);
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

  it('registers the text-first workstation command', () => {
    const packageJson = JSON.parse(readFileSync(resolve(import.meta.dirname, '..', '..', '..', 'package.json'), 'utf8'));

    expect(packageJson.scripts['dogfood:storybook']).toBe('tsx examples/docs/storybook-workstation.ts');
  });
});
