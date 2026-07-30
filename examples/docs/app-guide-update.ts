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
  applyCounterDemoIntent,
  counterDemoIntentForAction,
  tickCounterDemoModel,
} from './counter-block-demo.js';
import {
  activateGuideRow,
  activateGuideRowIndex,
  focusGuideStateAndSelect,
  selectGuide,
} from './app-guide-navigation.js';
import {
  BLOCKS_PAGE_ID,
  COUNTER_DEMO_BLOCK_GUIDE_ID,
  type DocsPageId,
} from './app-ids.js';
import { nextLandingQualityMode } from './app-landing.js';
import { activateDogfoodLocale } from './app-localization.js';
import type {
  DocsAppOptions,
  DocsExplorerModel,
  DocsMsg,
} from './app-model.js';
import { nextDogfoodLocale } from './locale.js';

export function updateGuidePage(
  pageId: DocsPageId,
  message: FramePageMsg<DocsMsg>,
  model: DocsExplorerModel,
  i18n: I18nRuntime,
  options: DocsAppOptions,
): FramePageUpdateResult<DocsExplorerModel, DocsMsg> {
  if (message.type === 'mouse') return [model, []];
  if (message.type === 'pulse') {
    const deltaMs = Math.round(Math.max(0, message.dt) * 1000);
    const tickCounter =
      pageId === BLOCKS_PAGE_ID &&
      model.selectedGuideId === COUNTER_DEMO_BLOCK_GUIDE_ID;
    return [
      {
        ...model,
        previewTimeMs: model.previewTimeMs + deltaMs,
        counterBlockDemo: tickCounter
          ? tickCounterDemoModel(model.counterBlockDemo, deltaMs)
          : model.counterBlockDemo,
      },
      [],
    ];
  }
  switch (message.type) {
    case 'guide-next':
      return [focusGuideStateAndSelect(pageId, model, listFocusNext(model.guideState)), []];
    case 'guide-prev':
      return [focusGuideStateAndSelect(pageId, model, listFocusPrev(model.guideState)), []];
    case 'guide-page-down':
      return [
        focusGuideStateAndSelect(pageId, model, listPageDown(model.guideState)),
        [],
      ];
    case 'guide-page-up':
      return [
        focusGuideStateAndSelect(pageId, model, listPageUp(model.guideState)),
        [],
      ];
    case 'activate-guide':
      return [
        { ...activateGuideRow(model, pageId), previewTimeMs: 0 },
        [],
      ];
    case 'activate-guide-index':
      return [
        {
          ...activateGuideRowIndex(model, pageId, message.index),
          previewTimeMs: 0,
        },
        [],
      ];
    case 'select-guide':
      return [
        {
          ...selectGuide(pageId, model, message.guideId),
          previewTimeMs: 0,
        },
        [],
      ];
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
    case 'counter-block-intent':
      if (
        pageId !== BLOCKS_PAGE_ID ||
        model.selectedGuideId !== COUNTER_DEMO_BLOCK_GUIDE_ID
      ) {
        return [model, []];
      }
      return [
        {
          ...model,
          counterBlockDemo: applyCounterDemoIntent(
            model.counterBlockDemo,
            counterDemoIntentForAction(message.action),
          ),
          previewTimeMs: 0,
        },
        [],
      ];
    case 'family-next':
    case 'family-prev':
    case 'family-page-down':
    case 'family-page-up':
    case 'activate-row':
    case 'activate-row-index':
    case 'expand-row':
    case 'collapse-row':
    case 'select-story':
    case 'select-variant':
    case 'variant-next':
    case 'variant-prev':
    case 'set-profile':
      return [model, []];
  }
}
