import { z } from 'zod';
import { inspector } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import { withStructuredToolOutput } from '../output.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  title: z.string().describe('Inspector panel title.'),
  currentValue: z.string().optional().describe('Primary value to display prominently.'),
  currentValueLabel: z.string().optional().describe('Label for the current value.'),
  supportingText: z.string().optional().describe('Additional supporting text.'),
  supportingTextLabel: z.string().optional().describe('Label for supporting text.'),
  sections: z.array(z.object({
    title: z.string().describe('Section heading.'),
    content: z.string().describe('Section body text.'),
    tone: z.enum(['default', 'muted']).optional().describe('Section tone.'),
  })).optional().describe('Additional detail sections.'),
  chrome: z.enum(['boxed', 'none']).optional().describe('Border chrome style (default "boxed").'),
  width: z.number().optional().describe('Panel width.'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const inspectorTool: ToolRegistration = withStructuredToolOutput({
  name: 'bijou_inspector',
  description: 'Render an inspector panel with a title, primary value, supporting text, and detail sections.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const result = inspector({
      title: input.title, currentValue: input.currentValue,
      currentValueLabel: input.currentValueLabel, supportingText: input.supportingText,
      supportingTextLabel: input.supportingTextLabel, sections: input.sections,
      chrome: input.chrome, width: input.width, ctx,
    });
    return { content: [{ type: 'text', text: result }] };
  },
});
