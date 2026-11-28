import { alertSurface } from '../components/alert-v3.js';
import type { Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import type { RenderSection } from './render.part01.js';
import { flow, sectionAtoms, textAtoms } from './draw-status-flow.js';
import { alertVariant, findSection, hasSlot, knownAlertVariant, stackRows } from './draw-status-shared.js';

/** Border columns plus the alert icon and its gap. */
const ALERT_CHROME = 4;

/** Whether severity is text that names an alert variant, so the variant alone shows it. A Surface is always drawn. */
function recognisedSeverityText(severity: RenderSection): boolean {
  return severity.present && typeof severity.visualContent === 'string'
    && knownAlertVariant(severity.content) !== undefined;
}

/**
 * Draws `InFlowStatusBlock` as an alert whose variant follows `severity`
 * (`info`, `warning`, `error`, `success`; `critical` and `failed` draw `error`).
 * The message comes first; an unrecognised severity's text, the source and the
 * action follow, each wrapped to the width.
 */
function drawInFlowStatus(input: StandardDrawInput): Surface {
  const inner = input.bounds.width - ALERT_CHROME;
  const severity = findSection(input.sections, 'severity');
  const facts = [
    ...(severity !== undefined && !recognisedSeverityText(severity) ? [severity] : []),
    ...['source', 'action'].map((id) => findSection(input.sections, id)).filter(hasSlot),
  ];
  const factAtoms = facts.flatMap((fact, index) => [
    ...(index === 0 ? [] : textAtoms('·', inner)),
    ...sectionAtoms(fact, inner),
  ]);
  const rows = [
    flow(sectionAtoms(findSection(input.sections, 'message'), inner), inner),
    ...(facts.length === 0 ? [] : [flow(factAtoms, inner)]),
  ];
  return alertSurface(stackRows(rows, inner), {
    variant: alertVariant(severity?.present === true ? severity.content : undefined),
  });
}

export { drawInFlowStatus };
