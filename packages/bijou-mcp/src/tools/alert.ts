import { z } from 'zod';
import { alert } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  message: z.string().describe('Alert body text.'),
  variant: z.enum(['success', 'error', 'warning', 'info']).optional()
    .describe('Severity variant (default "info").'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const alertTool: ToolRegistration = {
  name: 'bijou_alert',
  description: 'Render an alert box with an icon and message. Variants: success (checkmark), error (cross), warning (!), info (i). Returns plain-text with box-drawing characters.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const result = alert(input.message, { variant: input.variant, ctx });
    return { content: [{ type: 'text', text: result }] };
  },
};
