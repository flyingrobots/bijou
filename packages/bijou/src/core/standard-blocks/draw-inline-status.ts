import { badge } from '../components/badge.js';
import { createSurface, type Surface } from '../../ports/surface.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';
import { FACT_SEPARATOR, hasText, statusVariant, textRow } from './draw-status-shared.js';

/**
 * A status badge followed by text on one row `width` wide. The badge variant
 * follows the status word (`ready` draws `success`, `failed` draws `error`).
 */
function badgeRow(status: string, text: string, width: number): Surface {
  const row = createSurface(width, 1);
  const pill = badge(status, { variant: statusVariant(status) });
  row.blit(pill, 0, 0);
  const x = pill.width + 1;
  if (x < width) {
    row.blit(textRow(text, width - x), x, 0);
  }
  return row;
}

/** Draws `InlineStatusBlock` as a status badge, the label and the message on one row. */
function drawInlineStatus(input: StandardDrawInput): Surface {
  const label = sectionContent(input.sections, 'label') ?? '';
  const message = sectionContent(input.sections, 'message');
  const text = hasText(message) ? `${label}${FACT_SEPARATOR}${message}` : label;
  return badgeRow(sectionContent(input.sections, 'status') ?? '', text, input.bounds.width);
}

export { badgeRow, drawInlineStatus };
