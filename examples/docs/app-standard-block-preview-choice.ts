import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { standardBlockPreviewText as dogfoodText } from './app-standard-block-preview-text.js';

export function standardBlockChoicePreviewSlots(
  blockName: string,
  localization: LocalizationPort,
): Readonly<Record<string, unknown>> | undefined {
  switch (blockName) {
    case 'SingleChoiceBlock':
      return {
        label: dogfoodText(localization, 'blocks.preview.singleChoice.label', 'Output mode'),
        options: [
          dogfoodText(localization, 'blocks.preview.singleChoice.option.interactive', 'interactive'),
          dogfoodText(localization, 'blocks.preview.singleChoice.option.pipe', 'pipe'),
          dogfoodText(localization, 'blocks.preview.singleChoice.option.accessible', 'accessible'),
        ],
        selected: dogfoodText(localization, 'blocks.preview.singleChoice.selected', 'pipe'),
        mode: dogfoodText(localization, 'blocks.preview.singleChoice.mode', 'radio'),
        validation: dogfoodText(localization, 'blocks.preview.singleChoice.validation', 'available'),
      };
    case 'MultipleChoiceBlock':
      return {
        label: dogfoodText(localization, 'blocks.preview.multipleChoice.label', 'Release proof'),
        checked: [
          dogfoodText(localization, 'blocks.preview.multipleChoice.checked.lint', 'lint'),
          dogfoodText(localization, 'blocks.preview.multipleChoice.checked.tests', 'tests'),
        ],
        unchecked: [
          dogfoodText(localization, 'blocks.preview.multipleChoice.unchecked.screenshots', 'screenshots'),
        ],
        selected: dogfoodText(localization, 'blocks.preview.multipleChoice.selected', 'lint; tests'),
        validation: dogfoodText(localization, 'blocks.preview.multipleChoice.validation', '2 of 3 complete'),
      };
    case 'BinaryDecisionBlock':
      return {
        label: dogfoodText(localization, 'blocks.preview.binaryDecision.label', 'Merge gate'),
        selected: dogfoodText(localization, 'blocks.preview.binaryDecision.selected', 'yes'),
        consequence: dogfoodText(localization, 'blocks.preview.binaryDecision.consequence', 'admin merge'),
        confirmation: dogfoodText(localization, 'blocks.preview.binaryDecision.confirmation', 'CI green'),
        disabledReason: dogfoodText(localization, 'blocks.preview.binaryDecision.disabledReason', 'none'),
      };
    case 'PeerNavigationBlock':
      return {
        previous: dogfoodText(localization, 'blocks.preview.peerNavigation.previous', 'Architecture'),
        current: dogfoodText(localization, 'blocks.preview.peerNavigation.current', 'Blocks'),
        next: dogfoodText(localization, 'blocks.preview.peerNavigation.next', 'Method'),
        route: dogfoodText(localization, 'blocks.preview.peerNavigation.route', 'docs/blocks'),
        status: dogfoodText(localization, 'blocks.preview.peerNavigation.status', 'available'),
      };
    case 'ProgressiveDisclosureBlock':
      return {
        label: dogfoodText(localization, 'blocks.preview.progressiveDisclosure.label', 'Advanced options'),
        state: dogfoodText(localization, 'blocks.preview.progressiveDisclosure.state', 'closed'),
        hiddenCount: 6,
        summary: dogfoodText(localization, 'blocks.preview.progressiveDisclosure.summary', '6 options hidden'),
        details: [
          dogfoodText(localization, 'blocks.preview.progressiveDisclosure.detail.debugTraces', 'debug traces'),
          dogfoodText(localization, 'blocks.preview.progressiveDisclosure.detail.layoutFacts', 'layout facts'),
        ],
      };
    default:
      return undefined;
  }
}
