import {
  boxSurface,
  type BijouContext,
  type BlockDefinition,
  type Surface,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { column, spacer } from '../_shared/example-surfaces.js';
import type { LandingThemeTokens } from './app-landing.js';
import { docsThemeBorderToken } from './app-docs-theme-tokens.js';
import {
  counterDemoBlock,
  counterDemoBlockConfig,
  counterDemoBlockSurface,
  counterDemoDocumentationText,
  counterDemoLoweringPreviewText,
  type CounterDemoModel,
} from './counter-block-demo.js';
import {
  standardBlockLivePreviewSurface,
  type ParagraphSurfaceRenderer,
} from './app-standard-block-live-preview.js';
import { standardBlockPreviewText as dogfoodText } from './app-standard-block-preview-text.js';

export interface BlockPreviewPaneChrome {
  readonly resolvePaneInnerWidth: (width: number) => number;
  readonly insetPaneSurface: (content: Surface, width: number) => Surface;
  readonly themedSeparatorSurface: (
    label: string,
    width: number,
    ctx: BijouContext,
    theme: LandingThemeTokens,
  ) => Surface;
  readonly paragraphSurface: ParagraphSurfaceRenderer;
}

export function renderBlocksPreviewPane(
  block: BlockDefinition,
  width: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
  chrome: BlockPreviewPaneChrome,
): Surface {
  const paneWidth = chrome.resolvePaneInnerWidth(width);
  const bodyWidth = Math.max(28, paneWidth - 6);

  return chrome.insetPaneSurface(column([
    chrome.themedSeparatorSurface(
      dogfoodText(localization, 'blocks.preview.separator', 'blocks • live preview'),
      paneWidth,
      ctx,
      theme,
    ),
    spacer(1, 1),
    standardBlockLivePreviewSurface(block, bodyWidth, ctx, theme, localization, chrome.paragraphSurface),
  ]), width);
}

export function renderCounterDemoPreviewPane(
  counterBlockDemo: CounterDemoModel,
  width: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
  chrome: BlockPreviewPaneChrome,
): Surface {
  const paneWidth = chrome.resolvePaneInnerWidth(width);
  const bodyWidth = Math.max(28, paneWidth - 6);
  const pageWidth = Math.max(30, bodyWidth);
  const pageContentWidth = Math.max(24, pageWidth - 4);
  const cardWidth = Math.max(30, Math.min(78, pageContentWidth));

  return chrome.insetPaneSurface(column([
    chrome.themedSeparatorSurface(
      dogfoodText(localization, 'blocks.preview.separator', 'blocks • live preview'),
      paneWidth,
      ctx,
      theme,
    ),
    spacer(1, 1),
    boxSurface(column([
      counterDemoBlockSurface(counterDemoBlockConfig(counterBlockDemo, ctx, cardWidth)),
      spacer(1, 1),
      boxSurface(chrome.paragraphSurface(counterDemoLoweringPreviewText(counterBlockDemo, cardWidth, ctx), cardWidth - 4), {
        title: dogfoodText(localization, 'blocks.preview.modeLoweringTitle', 'lowering summary'),
        width: cardWidth,
        borderToken: docsThemeBorderToken(theme),
        padding: { left: 1, right: 1 },
        ctx,
      }),
      spacer(1, 1),
      boxSurface(chrome.paragraphSurface(counterDemoDocumentationText(), cardWidth - 4), {
        title: dogfoodText(localization, 'blocks.preview.documentationTitle', 'documentation'),
        width: cardWidth,
        borderToken: docsThemeBorderToken(theme),
        padding: { left: 1, right: 1 },
        ctx,
      }),
    ]), {
      title: dogfoodText(localization, 'blocks.preview.pageTitle', '{blockName}', {
        blockName: counterDemoBlock.metadata.blockName,
      }),
      width: pageWidth,
      borderToken: docsThemeBorderToken(theme),
      padding: { left: 1, right: 1 },
      ctx,
    }),
  ]), width);
}
