import type { OutputMode } from '@flyingrobots/bijou';
import type {
  ComponentStory,
  StoryProfilePreset,
} from '../_stories/protocol.js';

export const REQUIRED_STORY_MODES: readonly OutputMode[] = [
  'interactive',
  'static',
  'pipe',
  'accessible',
];

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

export function createDogfoodStorybookWorkbenchModel(
  stories: readonly ComponentStory[],
  title: string,
): DogfoodStorybookWorkbenchModel {
  const families = new Map<
    string,
    { label: string; stories: DogfoodStorybookStorySummary[] }
  >();
  for (const story of stories) {
    const familyId = slugify(story.family);
    const existing = families.get(familyId);
    const summary = summarizeStory(story);
    if (existing == null) {
      families.set(familyId, {
        label: story.family,
        stories: [summary],
      });
    } else {
      existing.stories.push(summary);
    }
  }

  const familySummaries = [...families.entries()]
    .map(([id, family]) => ({
      id,
      label: family.label,
      stories: family.stories
        .slice()
        .sort((left, right) => left.title.localeCompare(right.title)),
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
  return {
    title,
    storyCount: stories.length,
    familyCount: familySummaries.length,
    variantCount: stories.reduce(
      (total, story) => total + story.variants.length,
      0,
    ),
    requiredModes: REQUIRED_STORY_MODES,
    families: familySummaries,
  };
}

export function renderDogfoodStorybookIndex(
  model: DogfoodStorybookWorkbenchModel,
  requiredModesLabel: string,
): string {
  const lines = [
    `# ${model.title}`,
    '',
    `Stories: ${String(model.storyCount)}`,
    `Families: ${String(model.familyCount)}`,
    `Variants: ${String(model.variantCount)}`,
    `${requiredModesLabel}: ${model.requiredModes.join(', ')}`,
  ];
  for (const family of model.families) {
    lines.push('', `## ${family.label}`);
    for (const story of family.stories) {
      lines.push(
        [
          `- ${story.id}`,
          story.title,
          `package:${story.packageName}`,
          `variants:${story.variantIds.join(',')}`,
          `modes:${story.profileModes.join(',')}`,
          story.sourcePath == null ? undefined : `source:${story.sourcePath}`,
        ]
          .filter((part): part is string => part != null)
          .join(' | '),
      );
    }
  }
  return lines.join('\n');
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

function uniqueModes(
  profiles: readonly StoryProfilePreset[],
): readonly OutputMode[] {
  return [...new Set(profiles.map((profile) => profile.mode))];
}

function slugify(value: string): string {
  const asciiSlug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (asciiSlug !== '') return asciiSlug;

  return (
    Array.from(
      value,
      (character) =>
        character.codePointAt(0)?.toString(36) ?? String(value.length),
    ).join('-') || String(value.length)
  );
}
