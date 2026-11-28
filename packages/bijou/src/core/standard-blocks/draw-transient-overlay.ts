import { boxSurface } from '../components/box-v3.js';
import type { Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import { statusAtoms } from './draw-inline-status.js';
import { flow, sectionAtoms } from './draw-status-flow.js';
import { findSection, hasSlot, stackRows } from './draw-status-shared.js';

/** Border columns plus one column of padding on each side. */
const NOTICE_CHROME = 4;

/**
 * Draws `TransientOverlayBlock` as a framed notice: the priority badge and the
 * message first, then the dismiss hint, each wrapped to the notice width.
 */
function drawTransientOverlay(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const inner = width - NOTICE_CHROME;
  const priority = findSection(input.sections, 'priority');
  const dismiss = findSection(input.sections, 'dismiss');
  const rows = [
    flow([
      ...(hasSlot(priority) ? statusAtoms(priority, inner) : []),
      ...sectionAtoms(findSection(input.sections, 'message'), inner),
    ], inner),
    ...(hasSlot(dismiss) ? [flow(sectionAtoms(dismiss, inner), inner)] : []),
  ];
  return boxSurface(stackRows(rows, inner), { width, padding: { left: 1, right: 1 } });
}

export { drawTransientOverlay };
