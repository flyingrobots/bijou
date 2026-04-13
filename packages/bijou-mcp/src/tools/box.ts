import { z } from 'zod';
import { box, headerBox } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import { withStructuredToolOutput } from '../output.js';
import type { ToolRegistration } from '../types.js';

const boxShape = {
  content: z.string().describe('Text to display inside the box (may contain newlines).'),
  title: z.string().optional().describe('Optional title displayed in the top border.'),
  padding: z.number().optional().describe('Uniform padding inside the box (default 1).'),
  width: z.number().optional().describe('Fixed box width in characters.'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const boxSchema = z.object(boxShape);

const headerBoxShape = {
  label: z.string().describe('Primary heading text.'),
  detail: z.string().optional().describe('Optional detail text shown after the label.'),
  padding: z.number().optional().describe('Uniform padding inside the box (default 1).'),
  width: z.number().optional().describe('Fixed box width in characters.'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const headerBoxSchema = z.object(headerBoxShape);

export const boxTool: ToolRegistration = withStructuredToolOutput({
  name: 'bijou_box',
  description: 'Render text inside a Unicode bordered box. Returns plain-text with box-drawing characters.',
  inputSchema: boxShape,
  handler: async (args) => {
    const input = boxSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const pad = input.padding ?? 1;
    const result = box(input.content, {
      title: input.title,
      width: input.width,
      padding: { top: 0, bottom: 0, left: pad, right: pad },
      ctx,
    });
    return { content: [{ type: 'text', text: result }] };
  },
});

export const headerBoxTool: ToolRegistration = withStructuredToolOutput({
  name: 'bijou_header_box',
  description: 'Render a labeled box with an optional detail line. Returns plain-text with box-drawing characters.',
  inputSchema: headerBoxShape,
  handler: async (args) => {
    const input = headerBoxSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const pad = input.padding ?? 1;
    const result = headerBox(input.label, {
      detail: input.detail,
      width: input.width,
      padding: { top: 0, bottom: 0, left: pad, right: pad },
      ctx,
    });
    return { content: [{ type: 'text', text: result }] };
  },
});
