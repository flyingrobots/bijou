import {
  listFocusNext,
  listFocusPrev,
  listPageDown,
  listPageUp,
  type FramePageMsg,
  type FramePageUpdateResult,
} from '../../packages/bijou-tui/src/index.js';
import type { I18nRuntime } from '../../packages/bijou-i18n/src/index.js';
import {
  activateFamilyRowIndex,
  activateFocusedRow,
  collapseFocusedFamily,
  expandFocusedFamily,
  selectStory,
} from './app-family-navigation.js';
import { activateDogfoodLocale } from './app-localization.js';
import type {
  DocsAppOptions,
  DocsExplorerModel,
  DocsMsg,
} from './app-model.js';
import {
  cycleVariantIndex,
  selectVariantIndex,
} from './app-story-catalog.js';
import { nextDogfoodLocale } from './locale.js';
import { nextLandingQualityMode } from './app-landing.js';

export function updateComponentsPage(
  message: FramePageMsg<DocsMsg>,
  model: DocsExplorerModel,
  i18n: I18nRuntime,
  options: DocsAppOptions,
): FramePageUpdateResult<DocsExplorerModel, DocsMsg> {
  if (message.type === 'mouse') return [model, []];
  if (message.type === 'pulse') {
    return [
      {
        ...model,
        previewTimeMs:
          model.previewTimeMs +
          Math.round(Math.max(0, message.dt) * 1000),
      },
      [],
    ];
  }
  switch (message.type) {
    case 'family-next':
      return [
        {
          ...model,
          familyState: listFocusNext(model.familyState),
          previewTimeMs: 0,
        },
        [],
      ];
    case 'family-prev':
      return [
        {
          ...model,
          familyState: listFocusPrev(model.familyState),
          previewTimeMs: 0,
        },
        [],
      ];
    case 'family-page-down':
      return [
        {
          ...model,
          familyState: listPageDown(model.familyState),
          previewTimeMs: 0,
        },
        [],
      ];
    case 'family-page-up':
      return [
        {
          ...model,
          familyState: listPageUp(model.familyState),
          previewTimeMs: 0,
        },
        [],
      ];
    case 'activate-row':
      return [activateFocusedRow(model), []];
    case 'activate-row-index':
      return [activateFamilyRowIndex(model, message.index), []];
    case 'expand-row':
      return [expandFocusedFamily(model), []];
    case 'collapse-row':
      return [collapseFocusedFamily(model), []];
    case 'select-story':
      return [selectStory(model, message.storyId), []];
    case 'select-variant':
      return [selectVariantIndex(model, message.index), []];
    case 'variant-next':
      return [cycleVariantIndex(model, 1), []];
    case 'variant-prev':
      return [cycleVariantIndex(model, -1), []];
    case 'set-profile':
      return [{ ...model, profileMode: message.mode }, []];
    case 'toggle-hints':
      return [{ ...model, showHints: !model.showHints }, []];
    case 'cycle-locale': {
      const locale = nextDogfoodLocale(model.locale);
      return [model, [activateDogfoodLocale(i18n, options, locale.id)]];
    }
    case 'locale-activated':
      return [{ ...model, locale: message.locale }, []];
    case 'cycle-landing-quality':
      return [
        {
          ...model,
          landingQualityMode: nextLandingQualityMode(
            model.landingQualityMode,
          ),
        },
        [],
      ];
    case 'guide-next':
    case 'guide-prev':
    case 'guide-page-down':
    case 'guide-page-up':
    case 'activate-guide':
    case 'activate-guide-index':
    case 'select-guide':
    case 'counter-block-intent':
      return [model, []];
  }
}
