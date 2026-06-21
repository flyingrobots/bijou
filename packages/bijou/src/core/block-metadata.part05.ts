import type { OutputMode } from './detect/tty.js';

import type { BlockSlot, BlockVariantMetadata } from './block-metadata.part01.js';

import { OUTPUT_MODES } from './block-metadata.part02.js';

import type { BlockMetadataIssue } from './block-metadata.part02.js';

import { pushSlotReferenceIssues } from './block-metadata.part06.js';

import { at, pushDuplicateStringIssues, pushRequiredTextIssue } from './block-metadata.part07.js';
export function pushModesIssues(
  issues: BlockMetadataIssue[],
  modes: readonly OutputMode[],
): void {
  if (modes.length === 0) {
    issues.push({
      kind: 'empty-list',
      severity: 'error',
      path: 'modes',
      message: 'modes must include at least one output mode',
    });
    return;
  }

  modes.forEach((mode, index) => {
    if (OUTPUT_MODES.includes(mode)) {
      return;
    }

    issues.push({
      kind: 'invalid-value',
      severity: 'error',
      path: at('modes', index),
      message: `unsupported output mode ${mode}`,
    });
  });
  pushDuplicateStringIssues(issues, modes, {
    label: 'mode',
    pathPrefix: 'modes',
  });
}
export function pushSlotsIssues(
  issues: BlockMetadataIssue[],
  slots: readonly BlockSlot[],
): void {
  if (slots.length === 0) {
    issues.push({
      kind: 'empty-list',
      severity: 'error',
      path: 'slots',
      message: 'slots must include at least one slot',
    });
    return;
  }

  slots.forEach((slot, index) => {
    pushRequiredTextIssue(issues, at('slots', index, 'id'), slot.id);
  });
  pushDuplicateStringIssues(issues, slots.map((slot) => slot.id), {
    label: 'slot id',
    pathPrefix: 'slots',
    valuePath: 'id',
  });
}
export function pushVariantIssues(
  issues: BlockMetadataIssue[],
  variants: readonly BlockVariantMetadata[],
  slots: readonly BlockSlot[],
): void {
  const slotIds = new Set(slots.map((slot) => slot.id).filter((id) => id.trim() !== ''));
  variants.forEach((variant, index) => {
    const path = at('variants', index);
    pushRequiredTextIssue(issues, `${path}.id`, variant.id);
    pushRequiredTextIssue(issues, `${path}.label`, variant.label);
    pushSlotReferenceIssues(issues, `${path}.requiredSlots`, variant.requiredSlots ?? [], slotIds);
    pushSlotReferenceIssues(issues, `${path}.optionalSlots`, variant.optionalSlots ?? [], slotIds);
  });
  pushDuplicateStringIssues(issues, variants.map((variant) => variant.id), {
    label: 'variant id',
    pathPrefix: 'variants',
    valuePath: 'id',
  });
}
