import { alertSurface } from '../components/alert-v3.js';
import type { Surface } from '../../ports/surface.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';
import { FACT_SEPARATOR, alertVariant, hasText, stackRows, textRow } from './draw-status-shared.js';

/** Border columns plus the alert icon and its gap. */
const ALERT_CHROME = 4;

/**
 * Draws `InFlowStatusBlock` as an alert whose variant follows `severity`
 * (`info`, `warning`, `error`, `success`; any other text draws `info`). The
 * message fills the first row; source and action share a second row.
 */
function drawInFlowStatus(input: StandardDrawInput): Surface {
  const inner = input.bounds.width - ALERT_CHROME;
  const severity = input.sections.find((section) => section.id === 'severity');
  const facts = [
    severity?.present === false ? severity.content : undefined,
    sectionContent(input.sections, 'source'),
    sectionContent(input.sections, 'action'),
  ].filter(hasText);
  const rows = [
    textRow(sectionContent(input.sections, 'message') ?? '', inner),
    ...(facts.length === 0 ? [] : [textRow(facts.join(FACT_SEPARATOR), inner)]),
  ];
  return alertSurface(stackRows(rows, inner), {
    variant: alertVariant(severity?.present === true ? severity.content : undefined),
  });
}

export { drawInFlowStatus };
