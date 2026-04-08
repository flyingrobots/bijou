import { z } from 'zod';
import { paginator } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  current: z.number().describe('Current page number (1-based).'),
  total: z.number().describe('Total number of pages.'),
  style: z.enum(['dots', 'text']).optional().describe('Paginator style (default "dots").'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const paginatorTool: ToolRegistration = {
  name: 'bijou_paginator',
  description: 'Render a page indicator showing current position. Styles: dots or text.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const result = paginator({ current: input.current, total: input.total, style: input.style, ctx });
    return { content: [{ type: 'text', text: result }] };
  },
};
