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

const REQUIRED_STORY_MODES: readonly OutputMode[] = ['interactive', 'static', 'pipe', 'accessible'];

export interface DogfoodStorybookStorySummary {
  readonly id: string;
  readonly title: string;
  readonly family: string;
  readonly packageName: string;
  readonly variantIds: readonly string[];
  readonly profileModes: readonly OutputMode[];
  readonly sourcePath?: string;
  readonly tags: readonly string[];
}

export interface DogfoodStorybookFamilySummary {
  readonly id: string;
  readonly label: string;
  readonly stories: readonly DogfoodStorybookStorySummary[];
}

export interface DogfoodStorybookWorkbenchModel {
  readonly title: string;
  readonly storyCount: number;
  readonly familyCount: number;
  readonly variantCount: number;
  readonly requiredModes: readonly OutputMode[];
  readonly families: readonly DogfoodStorybookFamilySummary[];
}

export interface CaptureDogfoodStorybookMatrixOptions {
  readonly storyId: string;
  readonly previewHeight?: number;
  readonly requiredModes?: readonly OutputMode[];
  readonly stories?: readonly ComponentStory[];
}

export function createDogfoodStorybookWorkbenchModel(
  stories: readonly ComponentStory[] = COMPONENT_STORIES,
): DogfoodStorybookWorkbenchModel {
  const families = new Map<string, { label: string; stories: DogfoodStorybookStorySummary[] }>();

  for (const story of stories) {
    const familyId = slugify(story.family);
    const existing = families.get(familyId);
    const summary = summarizeStory(story);
    if (existing == null) {
      families.set(familyId, { label: story.family, stories: [summary] });
      continue;
    }
    existing.stories.push(summary);
  }

  const familySummaries = [...families.entries()]
    .map(([id, family]) => ({
      id,
      label: family.label,
      stories: family.stories.slice().sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    title: 'Bijou Storybook-style Workstation',
    storyCount: stories.length,
    familyCount: familySummaries.length,
    variantCount: stories.reduce((total, story) => total + story.variants.length, 0),
    requiredModes: REQUIRED_STORY_MODES,
    families: familySummaries,
  };
}

export function renderDogfoodStorybookIndex(
  model: DogfoodStorybookWorkbenchModel = createDogfoodStorybookWorkbenchModel(),
): string {
  const lines = [
    `# ${model.title}`,
    '',
    `Stories: ${model.storyCount}`,
    `Families: ${model.familyCount}`,
    `Variants: ${model.variantCount}`,
    `Required modes: ${model.requiredModes.join(', ')}`,
  ];

  for (const family of model.families) {
    lines.push('', `## ${family.label}`);
    for (const story of family.stories) {
      lines.push([
        `- ${story.id}`,
        story.title,
        `package=${story.packageName}`,
        `variants=${story.variantIds.join(',')}`,
        `modes=${story.profileModes.join(',')}`,
        story.sourcePath == null ? undefined : `source=${story.sourcePath}`,
      ].filter((part): part is string => part != null).join(' | '));
    }
  }

  return lines.join('\n');
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
      const preset = story.profilePresets.find((profile) => profile.id === input.profile.id);
      const variant = story.variants.find((candidate) => candidate.id === input.variant.id);
      if (preset == null || variant == null) {
        return '';
      }

      const previewCtx = createStoryProfileContext(baseCtx, preset, {
        width: preset.width,
        height: options.previewHeight ?? 18,
      });
      const preview = storyPreviewSurface(variant.render({
        width: preset.width,
        ctx: previewCtx,
        state: variant.initialState as never,
        timeMs: 0,
      }));

      return stripAnsi(surfaceToString(preview, baseCtx.style)).trimEnd();
    },
  });
}

export function renderDogfoodStorybookMatrix(options: CaptureDogfoodStorybookMatrixOptions): string {
  return storyCaptureMatrixText(captureDogfoodStorybookMatrix(options));
}

function summarizeStory(story: ComponentStory): DogfoodStorybookStorySummary {
  return {
    id: story.id,
    title: story.title,
    family: story.family,
    packageName: story.package,
    variantIds: story.variants.map((variant) => variant.id),
    profileModes: uniqueModes(story.profilePresets),
    sourcePath: story.source?.examplePath,
    tags: story.tags ?? [],
  };
}

function profileToCaptureProfile(profile: StoryProfilePreset) {
  return {
    id: profile.id,
    label: profile.label,
    mode: profile.mode,
    width: profile.width,
  };
}

function uniqueModes(profiles: readonly StoryProfilePreset[]): readonly OutputMode[] {
  const seen = new Set<OutputMode>();
  const modes: OutputMode[] = [];
  for (const profile of profiles) {
    if (seen.has(profile.mode)) continue;
    seen.add(profile.mode);
    modes.push(profile.mode);
  }
  return modes;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'family';
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

if (process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli(process.argv.slice(2));
}
