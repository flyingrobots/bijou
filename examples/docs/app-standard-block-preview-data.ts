import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { standardBlockChoicePreviewSlots } from './app-standard-block-preview-choice.js';
import { standardBlockCorePreviewSlots } from './app-standard-block-preview-core.js';
import { standardBlockExplainPreviewSlots } from './app-standard-block-preview-explain.js';
import { standardBlockStatusPreviewSlots } from './app-standard-block-preview-status.js';
import { standardBlockStructurePreviewSlots } from './app-standard-block-preview-structure.js';

export function standardBlockExampleSlots(
  blockName: string,
  localization: LocalizationPort,
): Readonly<Record<string, unknown>> {
  return standardBlockCorePreviewSlots(blockName, localization)
    ?? standardBlockStatusPreviewSlots(blockName, localization)
    ?? standardBlockExplainPreviewSlots(blockName, localization)
    ?? standardBlockChoicePreviewSlots(blockName, localization)
    ?? standardBlockStructurePreviewSlots(blockName, localization)
    ?? {};
}
