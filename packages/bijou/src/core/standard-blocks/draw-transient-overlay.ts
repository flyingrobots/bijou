import { boxSurface } from '../components/box-v3.js';
import type { Surface } from '../../ports/surface.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';
import { badgeRow } from './draw-inline-status.js';
import { hasText, stackRows, textRow } from './draw-status-shared.js';

/** Border columns plus one column of padding on each side. */
const NOTICE_CHROME = 4;

/**
 * Draws `TransientOverlayBlock` as a framed notice: the priority badge and the
 * message on the first row, the dismiss hint on the next.
 */
function drawTransientOverlay(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const inner = width - NOTICE_CHROME;
  const message = sectionContent(input.sections, 'message') ?? '';
  const priority = sectionContent(input.sections, 'priority');
  const dismiss = sectionContent(input.sections, 'dismiss');
  const rows = [
    hasText(priority) ? badgeRow(priority, message, inner) : textRow(message, inner),
    ...(hasText(dismiss) ? [textRow(dismiss, inner)] : []),
  ];
  return boxSurface(stackRows(rows, inner), { width, padding: { left: 1, right: 1 } });
}

export { drawTransientOverlay };
