import { z } from 'zod';
import type { ToolRegistration, ToolResult, ToolResultContent, ZodShape } from './types.js';

export const toolOutputModeSchema = z.enum(['text', 'data', 'both']);
export type ToolOutputMode = z.infer<typeof toolOutputModeSchema>;

export const structuredToolOutputShape = {
  output: toolOutputModeSchema.describe('Resolved output mode for this tool call.'),
  rendered: z.string().optional().describe('Rendered plain-text output when requested.'),
  data: z.record(z.string(), z.unknown()).describe('Machine-readable semantic payload for the tool result.'),
} satisfies ZodShape;

const toolOutputInputShape = {
  output: toolOutputModeSchema.optional().describe(
    "Output mode: 'text' (default), 'data', or 'both'.",
  ),
} satisfies ZodShape;

export function withOutputMode<Shape extends ZodShape>(inputShape: Shape): Shape & typeof toolOutputInputShape {
  return {
    ...inputShape,
    ...toolOutputInputShape,
  };
}

export function stripOutputMode(args: Record<string, unknown>): Record<string, unknown> {
  const { output: _output, ...data } = args;
  return data;
}

export function buildStructuredToolResult(
  rendered: string,
  data: Record<string, unknown>,
  output: ToolOutputMode = 'text',
  content?: ToolResultContent[],
): ToolResult {
  return {
    content: output === 'data' ? [] : (content ?? [{ type: 'text', text: rendered }]),
    structuredContent: {
      output,
      ...(output === 'data' ? {} : { rendered }),
      data,
    },
  };
}

export function withStructuredToolOutput(tool: ToolRegistration): ToolRegistration {
  if (tool.outputSchema !== undefined) return tool;

  return {
    ...tool,
    inputSchema: withOutputMode(tool.inputSchema ?? {}),
    outputSchema: structuredToolOutputShape,
    handler: async (args) => {
      const result = await tool.handler(args);
      if (result['isError'] || result.structuredContent !== undefined) return result;

      const output = toolOutputModeSchema.optional().parse(args['output']) ?? 'text';
      const rendered = result.content.find((block) => block.type === 'text')?.text ?? '';
      return buildStructuredToolResult(rendered, stripOutputMode(args), output, result.content);
    },
  };
}
