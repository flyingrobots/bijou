import { z } from 'zod';
import { constrain } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  content: z.string().describe('Text content to constrain.'),
  maxWidth: z.number().optional().describe('Maximum width in columns.'),
  maxHeight: z.number().optional().describe('Maximum height in lines.'),
  ellipsis: z.string().optional().describe('Ellipsis string for truncation (default "…").'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const constrainTool: ToolRegistration = {
  name: 'bijou_constrain',
  description: 'Constrain text to a maximum width and/or height, truncating with ellipsis if needed.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const result = constrain(input.content, {
      maxWidth: input.maxWidth, maxHeight: input.maxHeight, ellipsis: input.ellipsis, ctx,
    });
    return { content: [{ type: 'text', text: result }] };
  },
};
