import { z } from 'zod';
import { markdown } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  source: z.string().describe('Raw markdown source text.'),
  width: z.number().optional().describe('Wrap width in columns (default 80).'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const markdownTool: ToolRegistration = {
  name: 'bijou_markdown',
  description: 'Render markdown for terminal display with headings, lists, code blocks, bold, italic, links, blockquotes, and horizontal rules. Returns plain-text with Unicode formatting.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const tw = input.terminalWidth ?? input.width ?? 80;
    const ctx = mcpContext(tw);
    const result = markdown(input.source, { width: input.width, ctx });
    return { content: [{ type: 'text', text: result }] };
  },
};
