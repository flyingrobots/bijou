import { z } from 'zod';
import { enumeratedList } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  items: z.array(z.string()).describe('List items to render.'),
  style: z.enum(['arabic', 'alpha', 'roman', 'bullet', 'dash', 'none'])
    .optional().describe('Bullet/numbering style (default "bullet").'),
  indent: z.number().optional().describe('Indentation level in spaces.'),
  start: z.number().optional().describe('Starting number for ordered styles.'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const enumeratedListTool: ToolRegistration = {
  name: 'bijou_enumerated_list',
  description: 'Render a list with bullets, numbers (arabic), letters (alpha), roman numerals, or dashes.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const result = enumeratedList(input.items, {
      style: input.style, indent: input.indent, start: input.start, ctx,
    });
    return { content: [{ type: 'text', text: result }] };
  },
};
