import { z } from 'zod';
import { badge, surfaceToString } from '@flyingrobots/bijou';
import { plainStyle } from '@flyingrobots/bijou/adapters/test';
import { mcpContext } from '../context.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  text: z.string().describe('Label to display inside the badge.'),
  variant: z.enum(['success', 'error', 'warning', 'info', 'accent', 'primary']).optional()
    .describe('Color variant (default "info").'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const badgeTool: ToolRegistration = {
  name: 'bijou_badge',
  description: 'Render an inline pill-shaped badge label. Variants: success, error, warning, info, accent, primary.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const surface = badge(input.text, { variant: input.variant, ctx });
    const result = surfaceToString(surface, plainStyle());
    return { content: [{ type: 'text', text: result }] };
  },
};
