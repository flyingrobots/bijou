import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { standardBlockPreviewText as dogfoodText } from './app-standard-block-preview-text.js';

export function standardBlockExplainPreviewSlots(
  blockName: string,
  localization: LocalizationPort,
): Readonly<Record<string, unknown>> | undefined {
  switch (blockName) {
    case 'ExplainabilityWalkthroughBlock':
      return {
        title: dogfoodText(localization, 'blocks.preview.explainabilityWalkthrough.title', 'Why this changed'),
        steps: [
          dogfoodText(localization, 'blocks.preview.explainabilityWalkthrough.step.inputChanged', 'input changed'),
          dogfoodText(
            localization,
            'blocks.preview.explainabilityWalkthrough.step.constraintTightened',
            'constraint tightened',
          ),
          dogfoodText(
            localization,
            'blocks.preview.explainabilityWalkthrough.step.previewRerendered',
            'preview re-rendered',
          ),
        ],
        evidence: dogfoodText(localization, 'blocks.preview.explainabilityWalkthrough.evidence', 'DF-040 playback'),
        decision: dogfoodText(
          localization,
          'blocks.preview.explainabilityWalkthrough.decision',
          'keep grouped proof visible',
        ),
        nextStep: dogfoodText(localization, 'blocks.preview.explainabilityWalkthrough.nextStep', 'open lower-mode output'),
      };
    case 'FormattedDocumentBlock':
      return {
        heading: dogfoodText(localization, 'blocks.preview.formattedDocument.heading', 'Blocks document'),
        body: dogfoodText(localization, 'blocks.preview.formattedDocument.body', 'Use prose for persistent product truth.'),
        callout: dogfoodText(
          localization,
          'blocks.preview.formattedDocument.callout',
          'Lower modes keep the same heading and body facts.',
        ),
        code: dogfoodText(localization, 'blocks.preview.formattedDocument.code', 'block: FormattedDocumentBlock'),
      };
    case 'LinkDestinationBlock':
      return {
        label: dogfoodText(localization, 'blocks.preview.linkDestination.label', 'DOGFOOD.md'),
        destination: dogfoodText(localization, 'blocks.preview.linkDestination.destination', 'docs/DOGFOOD.md'),
        kind: dogfoodText(localization, 'blocks.preview.linkDestination.kind', 'docs'),
        status: dogfoodText(localization, 'blocks.preview.linkDestination.status', 'available'),
      };
    case 'DividerBlock':
      return {
        label: dogfoodText(localization, 'blocks.preview.divider.label', 'Release Evidence'),
        style: dogfoodText(localization, 'blocks.preview.divider.style', 'rule'),
        density: dogfoodText(localization, 'blocks.preview.divider.density', 'compact'),
      };
    case 'TextEntryBlock':
      return {
        field: dogfoodText(localization, 'blocks.preview.textEntry.field', 'Search docs'),
        value: dogfoodText(localization, 'blocks.preview.textEntry.value', 'table'),
        placeholder: dogfoodText(localization, 'blocks.preview.textEntry.placeholder', 'type a query'),
        validation: dogfoodText(localization, 'blocks.preview.textEntry.validation', '4 results'),
        results: 4,
      };
    default:
      return undefined;
  }
}
