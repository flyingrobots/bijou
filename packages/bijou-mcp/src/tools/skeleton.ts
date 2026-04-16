import { z } from 'zod';
import { skeleton } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import { withStructuredToolOutput } from '../output.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  width: z.number().optional().describe('Width of each skeleton line in characters.'),
  lines: z.number().optional().describe('Number of skeleton lines (default 1).'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const skeletonTool: ToolRegistration = withStructuredToolOutput({
  name: 'bijou_skeleton',
  description: 'Render a placeholder skeleton loader (shimmering block characters). Useful for showing loading state.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const result = skeleton({ width: input.width, lines: input.lines, ctx });
    return { content: [{ type: 'text', text: result }] };
  },
});
