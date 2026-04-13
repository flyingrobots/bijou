import { z } from 'zod';
import { kbd } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import { withStructuredToolOutput } from '../output.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  key: z.string().describe('Key label to render (e.g. "Ctrl+C", "Enter").'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const kbdTool: ToolRegistration = withStructuredToolOutput({
  name: 'bijou_kbd',
  description: 'Render a keyboard key indicator (like an HTML <kbd> element). Shows a styled key label.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const result = kbd(input.key, { ctx });
    return { content: [{ type: 'text', text: result }] };
  },
});
