import type { BijouContext } from '../../packages/bijou/src/index.js';
import { createBrowsableListState } from '../../packages/bijou-tui/src/index.js';
import { COMPONENT_STORIES } from './stories.js';
import {
  BLOCKS_PAGE_ID,
  COMPONENTS_PAGE_ID,
  COUNTER_DEMO_BLOCK_GUIDE_ID,
  resolveDocsLayoutVariant,
  type DocsPageId,
} from './app-ids.js';
import type { DocsExplorerModel } from './app-model.js';
import { guideItemsForPage } from './app-guide-access.js';
import { createCounterDemoModel } from './counter-block-demo.js';
import { DOCS_SHELL_THEME_CHOICES } from './app-shell-theme-state.js';
import { STORY_FAMILIES, buildFamilyItems } from './app-story-catalog.js';
import { selectGuide } from './app-guide-navigation.js';
import { selectStory } from './app-family-navigation.js';

export function createInitialExplorerModel(
  context: BijouContext,
  pageId: DocsPageId,
  locale: string,
): DocsExplorerModel {
  const expandedFamilies = Object.fromEntries(
    STORY_FAMILIES.map((family) => [family.id, false]),
  );
  const guideItems = guideItemsForPage(pageId);
  const model: DocsExplorerModel = {
    layoutVariant: resolveDocsLayoutVariant(
      context.runtime.columns,
      context.runtime.rows,
    ),
    familyState: createBrowsableListState({
      items: buildFamilyItems(expandedFamilies),
      height: 14,
    }),
    expandedFamilies,
    selectedStoryId: undefined,
    profileMode: context.mode,
    variantIndexByStory: Object.fromEntries(
      COMPONENT_STORIES.map((story) => [story.id, 0]),
    ),
    previewTimeMs: 0,
    guideState: createBrowsableListState({
      items: guideItems,
      height: 14,
    }),
    selectedGuideId: guideItems[0]?.value,
    showHints: true,
    locale,
    landingThemeIndex: 0,
    activeShellThemeId: DOCS_SHELL_THEME_CHOICES[0]?.id,
    landingQualityMode: 'auto',
    counterBlockDemo: createCounterDemoModel(5),
  };
  return pageId === BLOCKS_PAGE_ID
    ? selectGuide(pageId, model, COUNTER_DEMO_BLOCK_GUIDE_ID)
    : model;
}

export function createInitialComponentsExplorerModel(
  context: BijouContext,
  locale: string,
  initialSelectedStoryId?: string,
): DocsExplorerModel {
  const model = createInitialExplorerModel(
    context,
    COMPONENTS_PAGE_ID,
    locale,
  );
  return initialSelectedStoryId == null
    ? model
    : selectStory(model, initialSelectedStoryId);
}
