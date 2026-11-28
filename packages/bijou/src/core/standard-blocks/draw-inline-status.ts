import type { Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import { badgeAtoms, flow, sectionAtoms, textAtoms, type FlowAtom } from './draw-status-flow.js';
import { findSection, hasSlot, statusVariant } from './draw-status-shared.js';
import type { RenderSection } from './render.part01.js';

/**
 * A status slot as a badge whose variant follows the status word (`ready`
 * draws `success`, `failed` draws `error`). A Surface value is blitted as it is.
 */
function statusAtoms(status: RenderSection | undefined, width: number): readonly Surface[] {
  if (status === undefined) return [];
  return typeof status.visualContent === 'string'
    ? badgeAtoms(status.content, statusVariant(status.content), width)
    : sectionAtoms(status, width);
}

/**
 * Draws `InlineStatusBlock` as a status badge, the label and the message,
 * continuing onto further rows when they do not fit on one.
 */
function drawInlineStatus(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const message = findSection(input.sections, 'message');
  const atoms: FlowAtom[] = [
    ...statusAtoms(findSection(input.sections, 'status'), width),
    ...sectionAtoms(findSection(input.sections, 'label'), width),
    ...(hasSlot(message) ? [...textAtoms('·', width), ...sectionAtoms(message, width)] : []),
  ];
  return flow(atoms, width);
}

export { drawInlineStatus, statusAtoms };
