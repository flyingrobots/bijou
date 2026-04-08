import { z } from 'zod';
import { timeline } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  events: z.array(z.object({
    label: z.string().describe('Primary label for the event.'),
    description: z.string().optional().describe('Longer description shown after the label.'),
    status: z.enum(['success', 'error', 'warning', 'info', 'active', 'muted']).optional()
      .describe('Status determining dot style (default "muted").'),
  })).describe('Array of timeline events.'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const timelineTool: ToolRegistration = {
  name: 'bijou_timeline',
  description: 'Render a vertical timeline with status-colored dots and connector lines. Returns plain-text with Unicode characters.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const result = timeline(input.events, { ctx });
    return { content: [{ type: 'text', text: result }] };
  },
};
