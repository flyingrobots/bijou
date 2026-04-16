import { z } from 'zod';
import { progressBar } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import { withStructuredToolOutput } from '../output.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  percent: z.number().min(0).max(100).describe('Progress percentage (0-100).'),
  width: z.number().optional().describe('Bar width in characters.'),
  showPercent: z.boolean().optional().describe('Show percentage label (default true).'),
  filled: z.string().optional().describe('Character for filled portion.'),
  empty: z.string().optional().describe('Character for empty portion.'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const progressBarTool: ToolRegistration = withStructuredToolOutput({
  name: 'bijou_progress_bar',
  description: 'Render a static progress bar showing completion percentage.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const result = progressBar(input.percent, {
      width: input.width, showPercent: input.showPercent,
      filled: input.filled, empty: input.empty, ctx,
    });
    return { content: [{ type: 'text', text: result }] };
  },
});
