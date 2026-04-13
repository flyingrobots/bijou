import { z } from 'zod';
import { accordion } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import { withStructuredToolOutput } from '../output.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  sections: z.array(z.object({
    title: z.string().describe('Section heading text.'),
    content: z.string().describe('Body content for the section.'),
    expanded: z.boolean().optional().describe('Whether the section is expanded (default false).'),
  })).describe('Array of accordion sections.'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const accordionTool: ToolRegistration = withStructuredToolOutput({
  name: 'bijou_accordion',
  description: 'Render collapsible accordion sections with expand/collapse indicators. Returns plain-text with Unicode arrow characters.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const result = accordion(input.sections, { ctx });
    return { content: [{ type: 'text', text: result }] };
  },
});
