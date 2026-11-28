import type { Surface } from '../../ports/surface.js';
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
    rows.push(regionSurface(actionCues(listedContent(actions, input.slots)), inner));
  }

  return blockFrame('InspectorPanel', stackRegions(rows, inner), input.bounds.width);
}

/** Joins the actions into one cue row; a Surface value is placed as it is. */
function actionCues(actions: RegionContent): RegionContent {
  if (typeof actions !== 'string') return actions;
  return actions.split('\n').map((action) => `▸ ${action}`).join('  ');
}
