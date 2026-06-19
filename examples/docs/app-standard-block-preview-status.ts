import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { standardBlockPreviewText as dogfoodText } from './app-standard-block-preview-text.js';

export function standardBlockStatusPreviewSlots(
  blockName: string,
  localization: LocalizationPort,
): Readonly<Record<string, unknown>> | undefined {
  switch (blockName) {
    case 'InlineStatusBlock':
      return {
        label: dogfoodText(localization, 'blocks.preview.inlineStatus.label', 'Docs inventory'),
        status: dogfoodText(localization, 'blocks.preview.inlineStatus.status', 'ready'),
        message: dogfoodText(localization, 'blocks.preview.inlineStatus.message', 'catalog synced'),
      };
    case 'InFlowStatusBlock':
      return {
        severity: dogfoodText(localization, 'blocks.preview.inFlowStatus.severity', 'warning'),
        source: dogfoodText(localization, 'blocks.preview.inFlowStatus.source', 'DOGFOOD Blocks'),
        message: dogfoodText(
          localization,
          'blocks.preview.inFlowStatus.message',
          'Preview data should stay explicit.',
        ),
        action: dogfoodText(localization, 'blocks.preview.inFlowStatus.action', 'Open story'),
      };
    case 'TransientOverlayBlock':
      return {
        priority: dogfoodText(localization, 'blocks.preview.transientOverlay.priority', 'normal'),
        message: dogfoodText(localization, 'blocks.preview.transientOverlay.message', 'Saved DOGFOOD route'),
        dismiss: dogfoodText(localization, 'blocks.preview.transientOverlay.dismiss', 'Esc dismisses'),
      };
    case 'ActivityStreamBlock':
      return {
        events: [
          dogfoodText(localization, 'blocks.preview.activityStream.event.testsPassed', '10:41 tests passed'),
          dogfoodText(localization, 'blocks.preview.activityStream.event.prOpened', '10:42 PR opened'),
        ],
        selected: dogfoodText(localization, 'blocks.preview.activityStream.selected', '10:41 tests passed'),
      };
    case 'ShortcutCueBlock':
      return {
        shortcuts: [
          dogfoodText(localization, 'blocks.preview.shortcutCue.search', '/ Search'),
          dogfoodText(localization, 'blocks.preview.shortcutCue.help', '? Help'),
          dogfoodText(localization, 'blocks.preview.shortcutCue.close', 'Esc Close'),
        ],
        scope: dogfoodText(localization, 'blocks.preview.shortcutCue.scope', 'Blocks page'),
      };
    case 'ProgressIndicatorBlock':
      return {
        label: dogfoodText(localization, 'blocks.preview.progressIndicator.label', 'Install packages'),
        value: '3',
        total: '5',
        percent: '60%',
      };
    case 'FramedGroupBlock':
      {
        const testsGreen = dogfoodText(localization, 'blocks.preview.framedGroup.item.testsGreen', 'tests green');
        return {
          title: dogfoodText(localization, 'blocks.preview.framedGroup.title', 'Release Checks'),
          items: [
            testsGreen,
            dogfoodText(localization, 'blocks.preview.framedGroup.item.docsUpdated', 'docs updated'),
            dogfoodText(localization, 'blocks.preview.framedGroup.item.prLinked', 'PR linked'),
          ],
          selected: testsGreen,
          mode: dogfoodText(localization, 'blocks.preview.framedGroup.mode', 'review'),
        };
      }
    default:
      return undefined;
  }
}
