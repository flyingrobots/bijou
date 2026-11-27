import { badge, type BadgeVariant } from '../components/badge.js';
import type { Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import {
  SELECTED_MARK, definedRows, factsRow, joinRow, presentSection, sectionText, stackRows, textRow,
} from './draw-data-rows.js';

const STATUS_VARIANTS: ReadonlyMap<string, BadgeVariant> = new Map<string, BadgeVariant>([
  ['success', 'success'], ['error', 'error'], ['warning', 'warning'], ['info', 'info'],
  ['pending', 'pending'], ['active', 'active'], ['muted', 'muted'],
]);

/**
 * Draws `ModeAwarePrimitiveBlock` as the primitive in a badge followed by its
 * `fact: value`, then its status and mode contract as one facts row when
 * present. A status that names a status key picks the badge variant; any other
 * status draws `info`. The badge carries the selection mark when `selected`
 * names the primitive.
 */
export function drawModeAwarePrimitive(input: StandardDrawInput): Surface {
  const { sections } = input;
  const primitive = sectionText(sections, 'primitive');
  const status = presentSection(sections, 'status')?.content;
  const variant = (status === undefined ? undefined : STATUS_VARIANTS.get(status)) ?? 'info';
  const marked = presentSection(sections, 'selected')?.content === primitive;

  const primitiveRow = joinRow([
    textRow(marked ? SELECTED_MARK : ' '),
    badge(primitive, { variant }),
    textRow(`${sectionText(sections, 'fact')}: ${sectionText(sections, 'value')}`),
  ]);
  const rows = [primitiveRow, factsRow(sections, ['status', 'modeContract'])];
  return stackRows(definedRows(rows), input.bounds.width);
}
