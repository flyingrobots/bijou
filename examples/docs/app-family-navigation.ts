import { findComponentStory } from './stories.js';
import type { DocsExplorerModel } from './app-model.js';
import { STORY_FAMILIES } from './app-story-catalog.js';
import {
  focusFamilyRow,
  focusedRow,
  rebuildFamilyState,
} from './app-list-state.js';

const familyContainsStory = (familyId: string, storyId: string): boolean =>
  STORY_FAMILIES.some(
    (family) =>
      family.id === familyId &&
      family.stories.some((story) => story.id === storyId),
  );

export function toggleFamily(
  model: DocsExplorerModel,
  familyId: string,
): DocsExplorerModel {
  const expanded = model.expandedFamilies[familyId] ?? false;
  const expandedFamilies = {
    ...model.expandedFamilies,
    [familyId]: !expanded,
  };
  const selectedStoryId =
    expanded &&
    model.selectedStoryId != null &&
    familyContainsStory(familyId, model.selectedStoryId)
      ? undefined
      : model.selectedStoryId;
  return {
    ...model,
    expandedFamilies,
    selectedStoryId,
    previewTimeMs: 0,
    familyState: rebuildFamilyState(
      model.familyState,
      expandedFamilies,
      `family:${familyId}`,
    ),
  };
}

export function expandFocusedFamily(
  model: DocsExplorerModel,
): DocsExplorerModel {
  const row = focusedRow(model);
  if (row?.kind !== 'family' || model.expandedFamilies[row.familyId]) {
    return model;
  }
  return toggleFamily(model, row.familyId);
}

export function collapseFocusedFamily(
  model: DocsExplorerModel,
): DocsExplorerModel {
  const row = focusedRow(model);
  if (row == null) return model;
  if (row.kind === 'family') {
    return model.expandedFamilies[row.familyId]
      ? toggleFamily(model, row.familyId)
      : model;
  }
  const family = STORY_FAMILIES.find(
    (candidate) => candidate.id === row.familyId,
  );
  if (family == null) return model;
  const expandedFamilies = {
    ...model.expandedFamilies,
    [row.familyId]: false,
  };
  return {
    ...model,
    selectedStoryId:
      model.selectedStoryId === row.storyId
        ? undefined
        : model.selectedStoryId,
    previewTimeMs: 0,
    expandedFamilies,
    familyState: rebuildFamilyState(
      model.familyState,
      expandedFamilies,
      `family:${row.familyId}`,
    ),
  };
}

export function selectStory(
  model: DocsExplorerModel,
  storyId?: string,
): DocsExplorerModel {
  if (storyId == null || findComponentStory(storyId) == null) return model;
  const family = STORY_FAMILIES.find((candidate) =>
    candidate.stories.some((story) => story.id === storyId),
  );
  if (family == null) return model;
  const expandedFamilies = {
    ...model.expandedFamilies,
    [family.id]: true,
  };
  return {
    ...model,
    expandedFamilies,
    selectedStoryId: storyId,
    previewTimeMs: 0,
    familyState: rebuildFamilyState(
      model.familyState,
      expandedFamilies,
      `story:${storyId}`,
    ),
  };
}

export function activateFocusedRow(
  model: DocsExplorerModel,
): DocsExplorerModel {
  const row = focusedRow(model);
  if (row == null) return model;
  return row.kind === 'family'
    ? toggleFamily(model, row.familyId)
    : selectStory(model, row.storyId);
}

export const activateFamilyRowIndex = (
  model: DocsExplorerModel,
  index: number,
): DocsExplorerModel => activateFocusedRow(focusFamilyRow(model, index));
