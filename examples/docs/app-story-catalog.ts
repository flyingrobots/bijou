import type { ComponentStory } from '../_stories/protocol.js';
import { COMPONENT_STORIES, findComponentStory } from './stories.js';
import { resolveDogfoodDocsCoverage } from './coverage.js';
import type { DocsExplorerModel, StoryFamily } from './app-model.js';
import { slugify } from './app-slug.js';

const buildStoryFamilies = (
  stories: readonly ComponentStory[],
): readonly StoryFamily[] => {
  const families = new Map<
    string,
    { label: string; stories: ComponentStory[] }
  >();
  for (const story of stories) {
    const existing = families.get(story.family);
    if (existing == null) {
      families.set(story.family, {
        label: story.family,
        stories: [story],
      });
    } else {
      existing.stories.push(story);
    }
  }
  return Array.from(families.values()).map((family) => ({
    id: slugify(family.label),
    label: family.label,
    stories: family.stories,
  }));
};

export const STORY_FAMILIES = buildStoryFamilies(COMPONENT_STORIES);
export const DOGFOOD_DOCS_COVERAGE =
  resolveDogfoodDocsCoverage(COMPONENT_STORIES);

export function buildFamilyItems(
  expandedFamilies: Readonly<Record<string, boolean>>,
): readonly { label: string; value: string }[] {
  const items: { label: string; value: string }[] = [];
  for (const family of STORY_FAMILIES) {
    const expanded = expandedFamilies[family.id] ?? false;
    items.push({
      label: `${expanded ? 'v' : '>'} ${family.label}`,
      value: `family:${family.id}`,
    });
    if (!expanded) continue;
    for (const story of family.stories) {
      items.push({ label: `  ${story.title}`, value: `story:${story.id}` });
    }
  }
  return items;
}

export function selectedStory(
  model: DocsExplorerModel,
): ComponentStory | undefined {
  return model.selectedStoryId == null
    ? undefined
    : findComponentStory(model.selectedStoryId);
}

export const selectedVariantIndex = (
  model: DocsExplorerModel,
  storyId: string,
): number => model.variantIndexByStory[storyId] ?? 0;

export function cycleVariantIndex(
  model: DocsExplorerModel,
  delta: number,
): DocsExplorerModel {
  const story = selectedStory(model);
  if (story == null || story.variants.length === 0) return model;
  const count = story.variants.length;
  const next =
    ((selectedVariantIndex(model, story.id) + delta) % count + count) % count;
  return {
    ...model,
    variantIndexByStory: {
      ...model.variantIndexByStory,
      [story.id]: next,
    },
    previewTimeMs: 0,
  };
}

export function selectVariantIndex(
  model: DocsExplorerModel,
  index: number,
): DocsExplorerModel {
  const story = selectedStory(model);
  if (story == null || story.variants.length === 0) return model;
  const nextIndex = Math.max(0, Math.min(index, story.variants.length - 1));
  return {
    ...model,
    variantIndexByStory: {
      ...model.variantIndexByStory,
      [story.id]: nextIndex,
    },
    previewTimeMs: 0,
  };
}
