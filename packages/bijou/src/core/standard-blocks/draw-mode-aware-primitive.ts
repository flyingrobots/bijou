import type { BadgeVariant } from '../components/badge.js';
import { createTextSurface } from '../components/surface-text.js';
import type { Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import { SELECTED_MARK, factsRows, joinRow, presentText, sectionVisual, stackRows } from './draw-data-rows.js';
import { badgeRows, contentRows, prefixedRows, wrapLines } from './draw-data-wrap.js';

const STATUS_VARIANTS: ReadonlyMap<string, BadgeVariant> = new Map<string, BadgeVariant>([
  ['success', 'success'], ['error', 'error'], ['warning', 'warning'], ['info', 'info'],
  ['pending', 'pending'], ['active', 'active'], ['muted', 'muted'],
]);

interface FactValueRows {
  readonly beside: Surface | undefined;
  readonly below: readonly Surface[];
}

/** The `fact: value` rows: beside the badge when they fit there on one row, else below it, indented. */
function factValueRows(input: StandardDrawInput, besideWidth: number): FactValueRows {
  const fact = sectionVisual(input.sections, 'fact');
  const value = sectionVisual(input.sections, 'value');
  const width = input.bounds.width;
  if (typeof fact !== 'string' || typeof value !== 'string') {
    return { beside: undefined, below: [...prefixedRows('  ', fact, width), ...prefixedRows('  ', value, width)] };
  }
  const text = `${fact}: ${value}`;
  if (wrapLines(text, besideWidth).length === 1) return { beside: contentRows(text, besideWidth)[0], below: [] };
  return { beside: undefined, below: prefixedRows('  ', text, width) };
}

/**
 * Draws `ModeAwarePrimitiveBlock` as the primitive in a badge followed by its
 * `fact: value`, then its status and mode contract as facts when present. A
 * status that names a status key picks the badge variant; any other status
 * draws `info`. The badge carries the selection mark when `selected` names the
 * primitive. Long text wraps; a long primitive takes one badge per line.
 */
export function drawModeAwarePrimitive(input: StandardDrawInput): Surface {
  const { sections } = input;
  const width = input.bounds.width;
  const primitive = sectionVisual(sections, 'primitive');
  const status = presentText(sections, 'status');
  const variant = (status === undefined ? undefined : STATUS_VARIANTS.get(status)) ?? 'info';
  const marked = typeof primitive === 'string' && presentText(sections, 'selected') === primitive;

  const badgeLines = badgeRows(primitive, width - 2, variant);
  const badges = stackRows(badgeLines, Math.max(1, ...badgeLines.map((row) => row.width)));
  const facts = factValueRows(input, width - 3 - badges.width);
  const lead = [createTextSurface(marked ? SELECTED_MARK : ' '), badges];
  const rows = [
    joinRow(facts.beside === undefined ? lead : [...lead, facts.beside]),
    ...facts.below,
    ...factsRows(sections, ['status', 'modeContract'], width),
  ];
  return stackRows(rows, width);
}
