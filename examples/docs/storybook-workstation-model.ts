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
  const families = new Map<string, DogfoodStorybookStorySummary[]>();
  for (const story of stories) {
    const existing = families.get(story.family);
    const summary = summarizeStory(story);
    if (existing == null) {
      families.set(story.family, [summary]);
    } else {
      existing.push(summary);
    }
  }
  const familySummaries = [...families.entries()]
    .map(([label, familyStories]) => ({
      id: slugify(label),
      label,
      stories: familyStories
        .slice()
        .sort((left, right) => left.title.localeCompare(right.title)),
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
  const idCounts = new Map<string, number>();
  for (const family of familySummaries) {
    idCounts.set(family.id, (idCounts.get(family.id) ?? 0) + 1);
  }
  const uniqueFamilySummaries = familySummaries.map((family) =>
    idCounts.get(family.id) === 1
      ? family
      : { ...family, id: `${family.id}--${encodeIdentity(family.label)}` },
  );
  return {
    title,
    storyCount: stories.length,
    familyCount: uniqueFamilySummaries.length,
    variantCount: stories.reduce(
      (total, story) => total + story.variants.length,
      0,
    ),
    requiredModes: REQUIRED_STORY_MODES,
    families: uniqueFamilySummaries,
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

  return encodeIdentity(value);
}

function encodeIdentity(value: string): string {
  return (
    Array.from(value, (character) =>
      (character.codePointAt(0) ?? value.length).toString(36),
    ).join('-') || String(value.length)
  );
}
