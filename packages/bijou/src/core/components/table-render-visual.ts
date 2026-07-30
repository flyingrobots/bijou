import type { BijouContext } from '../../ports/context.js';
import { buildFittedTable } from './table-build.js';
import type {
  TableOptions,
  TableVariant,
} from './table-contract.js';
import type { NormalizedTable } from './table-model.js';
import {
  renderHeaderRuleTable,
  renderPlainTable,
  renderRuledTable,
} from './table-render-borderless.js';
import { renderExpandedTable } from './table-render-expanded.js';
import { renderGridTable } from './table-render-grid.js';
import {
  markdownTableData,
  renderMarkdownTable,
} from './table-render-markdown.js';

export function renderVisualTable(
  options: TableOptions,
  ctx: BijouContext,
  tableData: NormalizedTable,
  variant: TableVariant,
): string {
  if (variant === 'markdown') {
    return renderMarkdownTable(
      buildFittedTable(
        options,
        ctx,
        markdownTableData(tableData),
        'markdown',
        { styleHeaders: false },
      ),
    );
  }
  if (variant === 'expanded') {
    return renderExpandedTable(tableData, options, ctx);
  }
  const model = buildFittedTable(options, ctx, tableData, variant);
  switch (variant) {
    case 'ascii-grid':
      return renderGridTable(model, options, ctx, 'ascii-grid');
    case 'ruled':
      return renderRuledTable(model, options, ctx, true);
    case 'header-rule':
      return renderHeaderRuleTable(model);
    case 'plain':
      return renderPlainTable(model);
    case 'definition':
      return renderRuledTable(model, options, ctx, true);
    case 'box':
    default:
      return renderGridTable(model, options, ctx, 'box');
  }
}
