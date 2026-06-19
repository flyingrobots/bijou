import {
  blockRenderNode,
  inspectorPanelBlock,
  readerSurfaceBlock,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { standardBlockPreviewText as dogfoodText } from './app-standard-block-preview-text.js';

export function standardBlockCorePreviewSlots(
  blockName: string,
  localization: LocalizationPort,
): Readonly<Record<string, unknown>> | undefined {
  switch (blockName) {
    case 'AppShell':
      return {
        navigation: dogfoodText(localization, 'blocks.preview.appShell.navigation', 'Guides / Components / Blocks'),
        content: blockRenderNode(readerSurfaceBlock, {
          config: { width: 58, sectionHeight: 4 },
          slots: {
            content: dogfoodText(
              localization,
              'blocks.preview.readerSurface.content',
              'ReaderSurface live content from DOGFOOD Blocks.',
            ),
          },
        }),
        inspector: blockRenderNode(inspectorPanelBlock, {
          config: { width: 58, sectionHeight: 4 },
          slots: {
            selection: dogfoodText(localization, 'blocks.preview.inspectorPanel.selection', 'ReaderSurface'),
            details: ['schema-bound', 'provider-ready', 'command-aware'],
          },
        }),
        status: dogfoodText(localization, 'blocks.preview.inlineStatus.status', 'ready'),
        overlays: [],
      };
    case 'ReaderSurface':
      return {
        content: dogfoodText(
          localization,
          'blocks.preview.readerSurface.content',
          'ReaderSurface live content from DOGFOOD Blocks.',
        ),
        navigation: dogfoodText(localization, 'blocks.preview.readerSurface.navigation', 'Blocks navigation'),
        outline: [
          dogfoodText(localization, 'blocks.preview.readerSurface.outline.what', 'What are Blocks'),
          dogfoodText(localization, 'blocks.preview.readerSurface.outline.lowering', 'How Blocks Lower'),
        ],
      };
    case 'InspectorPanel':
      return {
        selection: dogfoodText(localization, 'blocks.preview.inspectorPanel.selection', 'ReaderSurface'),
        details: ['schema-bound', 'provider-ready', 'command-aware'],
        actions: [
          dogfoodText(localization, 'blocks.preview.inspectorPanel.action.reveal', 'Reveal selection'),
          dogfoodText(localization, 'blocks.preview.inspectorPanel.action.focus', 'Focus source'),
        ],
      };
    default:
      return undefined;
  }
}
