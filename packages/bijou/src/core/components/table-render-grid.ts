import type { BijouContext } from '../../ports/context.js';
import { makeBgFill } from '../bg-fill.js';
import type { TableOptions } from './table-contract.js';
import { alignCell } from './table-measure.js';
import type { FittedTable } from './table-model.js';

export function renderGridTable(
  model: FittedTable,
  options: TableOptions,
  ctx: BijouContext,
  variant: 'box' | 'ascii-grid',
  styled = true,
): string {
  const borderToken = options.borderToken ?? ctx.border('muted');
  const border = (value: string): string =>
    styled ? ctx.style.styled(borderToken, value) : value;
  const chars = variant === 'box'
    ? {
        h: '\u2500',
        v: '\u2502',
        topLeft: '\u250c',
        topMid: '\u252c',
        topRight: '\u2510',
        midLeft: '\u251c',
        midMid: '\u253c',
        midRight: '\u2524',
        bottomLeft: '\u2514',
        bottomMid: '\u2534',
        bottomRight: '\u2518',
      }
    : {
        h: '-',
        v: '|',
        topLeft: '+',
        topMid: '+',
        topRight: '+',
        midLeft: '+',
        midMid: '+',
        midRight: '+',
        bottomLeft: '+',
        bottomMid: '+',
        bottomRight: '+',
      };
  const horizontal = (
    left: string,
    middle: string,
    right: string,
  ): string => {
    const segments = model.widths.map((width) =>
      chars.h.repeat(width + 2),
    );
    return border(left + segments.join(middle) + right);
  };
  const top = horizontal(chars.topLeft, chars.topMid, chars.topRight);
  const middle = horizontal(chars.midLeft, chars.midMid, chars.midRight);
  const bottom = horizontal(
    chars.bottomLeft,
    chars.bottomMid,
    chars.bottomRight,
  );
  const headerFill = styled
    ? makeBgFill(options.headerBgToken, ctx)
    : undefined;
  const headerRows = Array.from(
    { length: model.headerHeight },
    (_row, rowIndex) => {
      const cells = model.columns.map(
        (column, index) =>
          ' '
          + alignCell(
            model.headerLines[index]?.[rowIndex] ?? '',
            column.width,
            column.align,
          )
          + ' ',
      );
      const row = border(chars.v)
        + cells.join(border(chars.v))
        + border(chars.v);
      return headerFill == null ? row : headerFill(row);
    },
  );
  const dataRows = model.rows.flatMap((row) =>
    Array.from({ length: row.height }, (_line, lineIndex) => {
      const cells = model.columns.map(
        (column, index) =>
          ' '
          + alignCell(
            row.cells[index]?.[lineIndex] ?? '',
            column.width,
            column.align,
          )
          + ' ',
      );
      return border(chars.v)
        + cells.join(border(chars.v))
        + border(chars.v);
    }),
  );
  return model.showHeader
    ? [top, ...headerRows, middle, ...dataRows, bottom].join('\n')
    : [top, ...dataRows, bottom].join('\n');
}
