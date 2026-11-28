import { tableSurface } from '../components/table-v3.js';
import type { TableSurfaceCell } from '../components/table-v3.js';
import { sanitizePlainTerminalText } from '../text/index.js';
import type { Surface } from '../../ports/surface.js';
import type { RenderSection } from './render.part01.js';
import type { StandardDrawInput } from './draw-input.js';
import { SELECTED_MARK, presentText, sectionVisual, stackRows } from './draw-data-rows.js';
import { contentRows } from './draw-data-wrap.js';

const COLUMN_IDS = ['metric', 'left', 'right', 'delta'] as const;
/** The table's borders and cell padding for four columns: five rules and two spaces per column. */
const TABLE_OVERHEAD = 13;

function columnHeader(sections: readonly RenderSection[], id: string): string {
  return sections.find((section) => section.id === id)?.label ?? id;
}

/**
 * One table cell: slot text sanitized with line breaks folded to spaces (the
 * table wraps it at words inside its column), or a nested Surface kept as it is.
 */
function cell(sections: readonly RenderSection[], id: string): TableSurfaceCell {
  const visual = sectionVisual(sections, id);
  return typeof visual === 'string' ? sanitizePlainTerminalText(visual) : visual;
}

function longestWord(value: TableSurfaceCell): number {
  if (typeof value !== 'string') return 1;
  return value.split(' ').reduce((longest, word) => Math.max(longest, word.length), 1);
}

/**
 * Column minimums that keep each cell's longest word whole, when every column's
 * minimum fits the row together; otherwise none, and the table breaks long words.
 */
function wordMinimums(cells: readonly TableSurfaceCell[], width: number): readonly (number | undefined)[] {
  const minimums = cells.map((value) => longestWord(value));
  const total = minimums.reduce((sum, minimum) => sum + minimum, 0);
  return total <= width - TABLE_OVERHEAD ? minimums : cells.map(() => undefined);
}

/**
 * Draws `DenseComparisonBlock` as its title over a table with one header row
 * (the metric, left, right and delta slot labels) and one logical data row.
 * At narrow widths the table wraps headers and cells onto more lines inside
 * that row; a header can break mid-word. When `selected` names the metric, the
 * metric cell carries the selection mark.
 */
export function drawDenseComparison(input: StandardDrawInput): Surface {
  const { sections } = input;
  const width = input.bounds.width;
  const cells = COLUMN_IDS.map((id) => cell(sections, id));
  const metric = cells[0];
  if (typeof metric === 'string' && presentText(sections, 'selected') === metric) {
    cells[0] = `${SELECTED_MARK} ${metric}`;
  }
  const minimums = wordMinimums(cells, width);

  const table = tableSurface({
    columns: COLUMN_IDS.map((id, index) => {
      const minWidth = minimums[index];
      return minWidth === undefined ? { header: columnHeader(sections, id) } : { header: columnHeader(sections, id), minWidth };
    }),
    rows: [cells],
    width,
  });
  return stackRows([...contentRows(sectionVisual(sections, 'title'), width), table], width);
}
