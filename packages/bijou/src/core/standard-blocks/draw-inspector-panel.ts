import type { Surface } from '../../ports/surface.js';
import { wrapToWidth } from '../text/wrap.js';
import type { StandardDrawInput } from './draw-input.js';
import { findSection, listedContent } from './draw-region-slots.js';
import {
  blockFrame,
  framedInnerWidth,
  regionSurface,
  ruleRow,
  stackRegions,
  type RegionContent,
} from './draw-regions.js';

/**
 * Draws `InspectorPanel` as one framed panel: the selection as a bold
 * heading over a rule, the details below it one per row, and the actions as
 * one cue row. `bounds.sectionHeight` caps the detail rows.
 */
export function drawInspectorPanel(input: StandardDrawInput): Surface {
  const inner = framedInnerWidth(input.bounds.width);
  const selection = findSection(input.sections, 'selection');
  const details = findSection(input.sections, 'details');
  const actions = findSection(input.sections, 'actions');

  const rows: Surface[] = [
    regionSurface(selection?.visualContent ?? '', inner, undefined, { modifiers: ['bold'] }),
  ];
  if (details !== undefined || actions !== undefined) {
    rows.push(ruleRow(inner));
  }
  if (details !== undefined) {
    rows.push(regionSurface(listedContent(details, input.slots), inner, input.bounds.sectionHeight));
  }
  if (actions !== undefined) {
    rows.push(regionSurface(actionCues(listedContent(actions, input.slots), inner), inner));
  }

  return blockFrame('InspectorPanel', stackRegions(rows, inner), input.bounds.width);
}

/**
 * Packs the actions into cue rows, `▸ action` each, two spaces apart. A cue
 * moves whole to the next row when it does not fit, so its mark stays with
 * its action. A Surface value is placed as it is.
 */
function actionCues(actions: RegionContent, width: number): RegionContent {
  if (typeof actions !== 'string') return actions;
  const rows: string[] = [];
  for (const cue of actions.split('\n').map((action) => `▸ ${action}`)) {
    const last = rows.at(-1);
    const joined = last === undefined ? cue : `${last}  ${cue}`;
    if (last !== undefined && wrapToWidth(joined, width).length === 1) {
      rows[rows.length - 1] = joined;
    } else {
      rows.push(cue);
    }
  }
  return rows.join('\n');
}
