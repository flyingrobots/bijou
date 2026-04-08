import { z } from 'zod';
import { table } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  columns: z.array(z.object({
    header: z.string(),
    width: z.number().optional(),
  })).describe('Column definitions with header text and optional fixed width.'),
  rows: z.array(z.array(z.string())).describe('Two-dimensional array of cell strings.'),
  width: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const tableTool: ToolRegistration = {
  name: 'bijou_table',
  description: 'Render a table with Unicode box-drawing borders. Returns a plain-text string with box-drawing characters that displays correctly in monospace contexts.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.width);
    const result = table({ columns: input.columns, rows: input.rows, ctx });
    return { content: [{ type: 'text', text: result }] };
  },
};
