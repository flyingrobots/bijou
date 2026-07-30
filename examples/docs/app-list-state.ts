import { createBrowsableListState } from '../../packages/bijou-tui/src/index.js';
import type { DocsExplorerModel, RowDescriptor } from './app-model.js';
import { STORY_FAMILIES, buildFamilyItems } from './app-story-catalog.js';
import { slugify } from './app-slug.js';

export function adjustScroll(
  focusIndex: number,
  scrollY: number,
  height: number,
  totalItems: number,
): number {
  let nextScrollY = scrollY;
  if (focusIndex < nextScrollY) {
    nextScrollY = focusIndex;
  } else if (focusIndex >= nextScrollY + height) {
    nextScrollY = focusIndex - height + 1;
  }
  return Math.min(nextScrollY, Math.max(0, totalItems - height));
}

export function focusedRow(
  model: DocsExplorerModel,
): RowDescriptor | undefined {
  const value = model.familyState.items[model.familyState.focusIndex]?.value;
  return value == null ? undefined : parseRowValue(value);
}

export function parseRowValue(value: string): RowDescriptor {
  if (value.startsWith('family:')) {
    const familyId = value.slice('family:'.length);
    return { kind: 'family', id: value, familyId };
  }
  const storyId = value.slice('story:'.length);
  const family = STORY_FAMILIES.find((candidate) =>
    candidate.stories.some((story) => story.id === storyId),
  );
  return {
    kind: 'story',
    id: value,
    storyId,
    familyId: family?.id ?? slugify(storyId),
  };
}

export function rebuildFamilyState(
  current: DocsExplorerModel['familyState'],
  expandedFamilies: Readonly<Record<string, boolean>>,
  preferredValue?: string,
): DocsExplorerModel['familyState'] {
  const items = buildFamilyItems(expandedFamilies);
  const next = createBrowsableListState({ items, height: current.height });
  const target =
    preferredValue ??
    current.items[current.focusIndex]?.value ??
    items[0]?.value;
  const focusIndex = Math.max(
    0,
    items.findIndex((item) => item.value === target),
  );
  return {
    ...next,
    focusIndex,
    scrollY: adjustScroll(
      focusIndex,
      current.scrollY,
      current.height,
      items.length,
    ),
  };
}

export function focusFamilyRow(
  model: DocsExplorerModel,
  index: number,
): DocsExplorerModel {
  const itemCount = model.familyState.items.length;
  if (itemCount === 0) return model;
  const focusIndex = Math.max(0, Math.min(index, itemCount - 1));
  return {
    ...model,
    familyState: {
      ...model.familyState,
      focusIndex,
      scrollY: adjustScroll(
        focusIndex,
        model.familyState.scrollY,
        model.familyState.height,
        itemCount,
      ),
    },
  };
}
