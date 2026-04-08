/**
 * Bijou MCP rendering server.
 *
 * Exposes Bijou terminal components as MCP tools over stdio.
 * Each tool accepts structured JSON, renders via Bijou with a plain-style
 * interactive context (Unicode box-drawing, no ANSI), and returns the
 * rendered string.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import type { ToolRegistration } from './types.js';
import { tableTool } from './tools/table.js';
import { boxTool, headerBoxTool } from './tools/box.js';
import { alertTool } from './tools/alert.js';
import { treeTool } from './tools/tree.js';
import { dagTool } from './tools/dag.js';
import { timelineTool } from './tools/timeline.js';
import { accordionTool } from './tools/accordion.js';
import { stepperTool } from './tools/stepper.js';
import { markdownTool } from './tools/markdown.js';

const TOOLS: readonly ToolRegistration[] = [
  tableTool,
  boxTool,
  headerBoxTool,
  alertTool,
  treeTool,
  dagTool,
  timelineTool,
  accordionTool,
  stepperTool,
  markdownTool,
];

const server = new McpServer({
  name: 'bijou-mcp',
  version: '4.1.0',
});

for (const tool of TOOLS) {
  server.tool(
    tool.name,
    tool.description,
    tool.inputSchema,
    async (args) => tool.handler(args as Record<string, unknown>),
  );
}

const transport = new StdioServerTransport();
await server.connect(transport);
