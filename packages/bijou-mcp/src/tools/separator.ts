import { z } from 'zod';
import { separator } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  label: z.string().optional().describe('Optional centered label text.'),
  width: z.number().optional().describe('Line width (default terminal width).'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const separatorTool: ToolRegistration = {
  name: 'bijou_separator',
  description: 'Render a horizontal separator line with an optional centered label.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const result = separator({ label: input.label, width: input.width, ctx });
    return { content: [{ type: 'text', text: result }] };
  },
};
