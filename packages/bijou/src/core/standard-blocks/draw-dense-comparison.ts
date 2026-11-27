import { tableSurface } from '../components/table-v3.js';
import { sanitizePlainTerminalText } from '../text/index.js';
import type { Surface } from '../../ports/surface.js';
import type { RenderSection } from './render.part01.js';
import type { StandardDrawInput } from './draw-input.js';
import { SELECTED_MARK, presentSection, sectionText, stackRows, textRow } from './draw-data-rows.js';

const COLUMN_IDS = ['metric', 'left', 'right', 'delta'] as const;

function columnHeader(sections: readonly RenderSection[], id: string): string {
  return sections.find((section) => section.id === id)?.label ?? id;
}

/** One table cell of slot text, kept on one line so the data row stays one row of the comparison. */
function cellText(sections: readonly RenderSection[], id: string): string {
  return sanitizePlainTerminalText(sectionText(sections, id));
}

/**
 * Draws `DenseComparisonBlock` as its title over a table with one header row
 * (the metric, left, right and delta slot labels) and one data row. When
 * `selected` names the metric, the metric cell carries the selection mark.
 */
export function drawDenseComparison(input: StandardDrawInput): Surface {
  const { sections } = input;
  const width = input.bounds.width;
  const metric = cellText(sections, 'metric');
  const selected = presentSection(sections, 'selected')?.content;
  const cells = COLUMN_IDS.map((id) => cellText(sections, id));
  cells[0] = selected === metric ? `${SELECTED_MARK} ${metric}` : metric;

  const table = tableSurface({
    columns: COLUMN_IDS.map((id) => ({ header: columnHeader(sections, id) })),
    rows: [cells],
    width,
  });
  return stackRows([textRow(sectionText(sections, 'title')), table], width);
}
