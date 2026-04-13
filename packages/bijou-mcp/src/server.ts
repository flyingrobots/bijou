/**
 * Bijou MCP rendering server.
 *
 * Exposes Bijou terminal components as MCP tools over stdio.
 * Each tool accepts structured JSON, renders via Bijou with a plain-style
 * interactive context (Unicode box-drawing, no ANSI), and returns the
 * rendered string.
 */

import { readFileSync } from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const { version: PACKAGE_VERSION } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string };

import type { ToolRegistration } from './types.js';
import { tableTool } from './tools/table.js';
import { boxTool, headerBoxTool } from './tools/box.js';
import { alertTool } from './tools/alert.js';
import { treeTool } from './tools/tree.js';
import { dagTool } from './tools/dag.js';
import { timelineTool } from './tools/timeline.js';
import { accordionTool } from './tools/accordion.js';
import { stepperTool } from './tools/stepper.js';
import { badgeTool } from './tools/badge.js';
import { separatorTool } from './tools/separator.js';
import { skeletonTool } from './tools/skeleton.js';
import { kbdTool } from './tools/kbd.js';
import { tabsTool } from './tools/tabs.js';
import { breadcrumbTool } from './tools/breadcrumb.js';
import { paginatorTool } from './tools/paginator.js';
import { enumeratedListTool } from './tools/enumerated-list.js';
import { hyperlinkTool } from './tools/hyperlink.js';
import { logTool } from './tools/log.js';
import { constrainTool } from './tools/constrain.js';
import { progressBarTool } from './tools/progress.js';
import { explainabilityTool } from './tools/explainability.js';
import { inspectorTool } from './tools/inspector.js';
import { createDocsTool } from './tools/docs.js';

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
  badgeTool,
  separatorTool,
  skeletonTool,
  kbdTool,
  tabsTool,
  breadcrumbTool,
  paginatorTool,
  enumeratedListTool,
  hyperlinkTool,
  logTool,
  constrainTool,
  progressBarTool,
  explainabilityTool,
  inspectorTool,
];

const docsTool = createDocsTool(TOOLS);

const server = new McpServer({
  name: 'bijou-mcp',
  version: PACKAGE_VERSION,
});

for (const tool of [...TOOLS, docsTool]) {
  server.tool(
    tool.name,
    tool.description,
    tool.inputSchema,
    async (args) => tool.handler(args as Record<string, unknown>),
  );
}

const transport = new StdioServerTransport();
await server.connect(transport);
