import { z } from 'zod';
import { tabs } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import { withStructuredToolOutput } from '../output.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  items: z.array(z.object({
    label: z.string().describe('Tab label text.'),
  })).describe('Tab items to render.'),
  active: z.number().describe('Zero-based index of the active tab.'),
  separator: z.string().optional().describe('Separator character between tabs.'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const tabsTool: ToolRegistration = withStructuredToolOutput({
  name: 'bijou_tabs',
  description: 'Render a horizontal tab bar with one active tab highlighted.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const result = tabs(input.items, { active: input.active, separator: input.separator, ctx });
    return { content: [{ type: 'text', text: result }] };
  },
});
