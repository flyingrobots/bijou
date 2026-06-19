import {
  boxSurface,
  blockRenderNode,
  renderBlockTree,
  type BijouContext,
  type BlockDefinition,
  type Surface,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { column, contentSurface, spacer } from '../_shared/example-surfaces.js';
import type { LandingThemeTokens } from './app-landing.js';
import { blockRenderOutputText, isSurfaceLike } from './app-block-render-output.js';
import { docsThemeBorderToken } from './app-docs-theme-tokens.js';
import { standardBlockDocumentationText } from './app-standard-block-docs.js';
import { standardBlockExampleSlots } from './app-standard-block-preview-data.js';
import { standardBlockPreviewText as dogfoodText } from './app-standard-block-preview-text.js';

type BorderTokenId = 'primary';
type StandardBlockId = 'AppShell';

const APP_SHELL_BLOCK_NAME = 'AppShell' satisfies StandardBlockId;
const PRIMARY_BORDER_ID = 'primary' satisfies BorderTokenId;

export type ParagraphSurfaceRenderer = (text: string, width: number) => Surface;

export function standardBlockLivePreviewSurface(
  block: BlockDefinition,
  width: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
  paragraphSurface: ParagraphSurfaceRenderer,
): Surface {
  const safeWidth = Math.max(30, width);
  const contentWidth = Math.max(24, safeWidth - 4);

  return column([
    standardBlockExampleSurface(block, contentWidth, ctx, localization),
    spacer(1, 1),
    standardBlockLoweringPreviewSurface(block, contentWidth, ctx, theme, localization, paragraphSurface),
    spacer(1, 1),
    standardBlockDocumentationSurface(block, contentWidth, ctx, theme, localization, paragraphSurface),
  ]);
}

function standardBlockExampleSurface(
  block: BlockDefinition,
  width: number,
  ctx: BijouContext,
  localization: LocalizationPort,
): Surface {
  const cardWidth = Math.max(30, Math.min(78, width));
  const rendered = renderBlockTree(blockRenderNode(block, {
    mode: 'interactive',
    slots: standardBlockExampleSlots(block.metadata.blockName, localization),
    config: standardBlockExampleConfig(cardWidth, block.metadata.blockName),
  }));

  if (isSurfaceLike(rendered.output)) {
    return rendered.output;
  }

  return boxSurface(contentSurface(blockRenderOutputText(rendered.output)), {
    title: block.metadata.blockName,
    width: cardWidth,
    borderToken: ctx.border(PRIMARY_BORDER_ID),
    padding: { left: 1, right: 1 },
    ctx,
  });
}

function standardBlockLoweringPreviewSurface(
  block: BlockDefinition,
  width: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
  paragraphSurface: ParagraphSurfaceRenderer,
): Surface {
  const safeWidth = Math.max(30, Math.min(78, width));
  const innerWidth = Math.max(24, safeWidth - 4);
  const slots = standardBlockExampleSlots(block.metadata.blockName, localization);
  const modeLines = block.metadata.modes.map((mode) => {
    const result = renderBlockTree(blockRenderNode(block, {
      mode: mode,
      slots,
      config: standardBlockExampleConfig(innerWidth, block.metadata.blockName),
    }));
    const outputSummary = blockRenderOutputText(result.output, Math.max(36, innerWidth - 22));
    const factsLine = dogfoodText(
      localization,
      'blocks.preview.loweringFacts',
      '{count} facts',
      { count: result.facts?.length ?? 0 },
    );
    const modeLabel = dogfoodText(localization, 'blocks.preview.modeTitle', '{mode} mode', { mode });

    return `${modeLabel}: ${outputSummary} (${factsLine})`;
  });

  return boxSurface(paragraphSurface(modeLines.join('\n'), innerWidth), {
    title: dogfoodText(localization, 'blocks.preview.modeLoweringTitle', 'lowering summary'),
    width: safeWidth,
    borderToken: docsThemeBorderToken(theme),
    padding: { left: 1, right: 1 },
    ctx,
  });
}

function standardBlockExampleConfig(width: number, blockName?: string): Readonly<Record<string, number>> {
  return {
    width,
    sectionHeight: blockName === APP_SHELL_BLOCK_NAME ? 8 : 5,
  };
}

function standardBlockDocumentationSurface(
  block: BlockDefinition,
  width: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
  paragraphSurface: ParagraphSurfaceRenderer,
): Surface {
  const cardWidth = Math.max(30, Math.min(78, width));
  const innerWidth = Math.max(24, cardWidth - 4);

  return boxSurface(paragraphSurface(standardBlockDocumentationText(block), innerWidth), {
    title: dogfoodText(localization, 'blocks.preview.documentationTitle', 'documentation'),
    width: cardWidth,
    borderToken: docsThemeBorderToken(theme),
    padding: { left: 1, right: 1 },
    ctx,
  });
}
