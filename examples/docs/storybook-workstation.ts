import { pathToFileURL } from 'node:url';
import {
  captureStoryMatrix,
  storyCaptureMatrixText,
  stripAnsi,
  surfaceToString,
  type OutputMode,
  type StoryCaptureMatrix,
} from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  createStoryProfileContext,
  storyPreviewSurface,
  type ComponentStory,
  type StoryProfilePreset,
} from '../_stories/protocol.js';
import { COMPONENT_STORIES } from './stories.js';
import {
  REQUIRED_STORY_MODES,
  renderDogfoodStorybookIndex,
} from './storybook-workstation-model.js';

export interface CaptureDogfoodStorybookMatrixOptions {
  readonly storyId: string;
  readonly previewHeight?: number;
  readonly requiredModes?: readonly OutputMode[];
  readonly stories?: readonly ComponentStory[];
}

export function captureDogfoodStorybookMatrix(
  options: CaptureDogfoodStorybookMatrixOptions,
): StoryCaptureMatrix {
  const stories = options.stories ?? COMPONENT_STORIES;
  const story = stories.find((candidate) => candidate.id === options.storyId);
  if (story == null) {
    throw new Error(`Unknown DOGFOOD story "${options.storyId}"`);
  }

  const baseCtx = createTestContext({
    mode: 'interactive',
    runtime: { columns: 120, rows: 40 },
  });
  const profiles = story.profilePresets.map(profileToCaptureProfile);
  const variants = story.variants.map((variant) => ({
    id: variant.id,
    label: variant.label,
    description: variant.description,
  }));

  return captureStoryMatrix({
    storyId: story.id,
    title: story.title,
    profiles,
    variants,
    requiredModes: options.requiredModes ?? REQUIRED_STORY_MODES,
    render(input) {
      const preset = story.profilePresets.find(
        (profile) => profile.id === input.profile.id,
      );
      const variant = story.variants.find(
        (candidate) => candidate.id === input.variant.id,
      );
      if (preset == null || variant == null) {
        return '';
      }

      const previewCtx = createStoryProfileContext(baseCtx, preset, {
        width: preset.width,
        height: options.previewHeight ?? 18,
      });
      const preview = storyPreviewSurface(
        variant.render({
          width: preset.width,
          ctx: previewCtx,
          state: variant.initialState,
          timeMs: 0,
        }),
      );

      return stripAnsi(surfaceToString(preview, baseCtx.style)).trimEnd();
    },
  });
}

export function renderDogfoodStorybookMatrix(
  options: CaptureDogfoodStorybookMatrixOptions,
): string {
  return storyCaptureMatrixText(captureDogfoodStorybookMatrix(options));
}

function profileToCaptureProfile(profile: StoryProfilePreset) {
  return {
    id: profile.id,
    label: profile.label,
    mode: profile.mode,
    width: profile.width,
  };
}

function cli(argv: readonly string[]): void {
  const storyId = valueAfter(argv, '--story');
  if (storyId == null) {
    console.log(renderDogfoodStorybookIndex());
    return;
  }

  console.log(renderDogfoodStorybookMatrix({ storyId }));
}

function valueAfter(argv: readonly string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  if (index < 0) return undefined;
  return argv[index + 1];
}

if (
  process.argv[1] != null &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  cli(process.argv.slice(2));
}

export {
  createDogfoodStorybookWorkbenchModel,
  renderDogfoodStorybookIndex,
} from './storybook-workstation-model.js';
export type {
  DogfoodStorybookFamilySummary,
  DogfoodStorybookStorySummary,
  DogfoodStorybookWorkbenchModel,
} from './storybook-workstation-model.js';
