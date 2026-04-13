import type { z } from 'zod';

/** MCP tool result content block. */
export interface ToolResultContent {
  type: 'text';
  text: string;
}

/** MCP tool result. */
export interface ToolResult {
  [key: string]: unknown;
  content: ToolResultContent[];
  structuredContent?: Record<string, unknown>;
}

/** Zod raw shape: keys mapping to Zod types, as MCP SDK expects. */
export type ZodShape = Record<string, z.ZodTypeAny>;

/** A tool registration combining name, description, Zod input shape, and handler. */
export interface ToolRegistration {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: ZodShape;
  readonly outputSchema?: ZodShape;
  readonly handler: (args: Record<string, unknown>) => Promise<ToolResult>;
}
