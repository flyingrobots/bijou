import { z } from 'zod';
import { breadcrumb } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import { withStructuredToolOutput } from '../output.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  items: z.array(z.string()).describe('Breadcrumb path segments (e.g. ["Home", "Docs", "API"]).'),
  separator: z.string().optional().describe('Separator between items (default " > ").'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const breadcrumbTool: ToolRegistration = withStructuredToolOutput({
  name: 'bijou_breadcrumb',
  description: 'Render a breadcrumb navigation trail. The last item is highlighted as the current location.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const result = breadcrumb(input.items, { separator: input.separator, ctx });
    return { content: [{ type: 'text', text: result }] };
  },
});
