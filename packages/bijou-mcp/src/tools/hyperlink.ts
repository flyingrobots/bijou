import { z } from 'zod';
import { hyperlink } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  text: z.string().describe('Display text for the hyperlink.'),
  url: z.string().describe('URL target.'),
  fallback: z.enum(['url', 'text', 'both']).optional()
    .describe('Fallback rendering when hyperlinks are unsupported (default "both").'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const hyperlinkTool: ToolRegistration = {
  name: 'bijou_hyperlink',
  description: 'Render a terminal hyperlink (OSC 8). Falls back to text + URL in plain mode.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const result = hyperlink(input.text, input.url, { fallback: input.fallback, ctx });
    return { content: [{ type: 'text', text: result }] };
  },
};
