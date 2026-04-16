import { z } from 'zod';
import { tree, type TreeNode } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import { withStructuredToolOutput } from '../output.js';
import type { ToolRegistration } from '../types.js';

interface RawTreeNode {
  label: string;
  children?: RawTreeNode[];
}

const treeNodeSchema: z.ZodType<RawTreeNode> = z.object({
  label: z.string().describe('Display text for this node.'),
  children: z.lazy(() => z.array(treeNodeSchema)).optional().describe('Nested child nodes.'),
});

const inputShape = {
  nodes: z.array(treeNodeSchema).describe('Top-level tree nodes.'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const treeTool: ToolRegistration = withStructuredToolOutput({
  name: 'bijou_tree',
  description: 'Render a tree hierarchy with Unicode box-drawing connectors (lines and corner pieces). Returns plain-text.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const result = tree(input.nodes as TreeNode[], { ctx });
    return { content: [{ type: 'text', text: result }] };
  },
});
