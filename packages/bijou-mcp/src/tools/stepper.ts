import { z } from 'zod';
import { stepper } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  steps: z.array(z.object({
    label: z.string().describe('Display text for this step.'),
  })).describe('Array of steps in the process.'),
  current: z.number().describe('Zero-based index of the current (active) step.'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const stepperTool: ToolRegistration = {
  name: 'bijou_stepper',
  description: 'Render a horizontal step-progress indicator with checkmarks, dots, and connectors. Returns plain-text with Unicode characters.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const result = stepper(input.steps, { current: input.current, ctx });
    return { content: [{ type: 'text', text: result }] };
  },
};
