import { z } from 'zod';
import { dag } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  nodes: z.array(z.object({
    id: z.string().describe('Unique node identifier.'),
    label: z.string().describe('Display text for the node.'),
    edges: z.array(z.string()).optional().describe('IDs of child nodes this node connects to.'),
    badge: z.string().optional().describe('Short annotation (e.g. status or count).'),
  })).describe('Array of DAG nodes with edges.'),
  maxWidth: z.number().optional().describe('Maximum render width (default 80).'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const dagTool: ToolRegistration = {
  name: 'bijou_dag',
  description: 'Render a directed graph with boxed nodes and edge lines. Returns plain-text with Unicode box-drawing characters.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const tw = input.terminalWidth ?? input.maxWidth ?? 80;
    const ctx = mcpContext(tw);
    const result = dag(input.nodes, { maxWidth: input.maxWidth, ctx });
    return { content: [{ type: 'text', text: result }] };
  },
};
