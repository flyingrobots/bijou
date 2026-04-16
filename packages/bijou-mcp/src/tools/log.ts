import { z } from 'zod';
import { log } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import { withStructuredToolOutput } from '../output.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  level: z.enum(['debug', 'info', 'warn', 'error']).describe('Log severity level.'),
  message: z.string().describe('Log message text.'),
  timestamp: z.boolean().optional().describe('Show timestamp prefix (default false).'),
  prefix: z.boolean().optional().describe('Show level prefix (default true).'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const logTool: ToolRegistration = withStructuredToolOutput({
  name: 'bijou_log',
  description: 'Render a styled log line with level icon and optional timestamp. Levels: debug, info, warn, error.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const result = log(input.level, input.message, {
      timestamp: input.timestamp, prefix: input.prefix, ctx,
    });
    return { content: [{ type: 'text', text: result }] };
  },
});
