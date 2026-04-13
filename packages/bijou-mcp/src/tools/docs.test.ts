import { describe, expect, it } from 'vitest';
import { accordionTool } from './accordion.js';
import { alertTool } from './alert.js';
import { badgeTool } from './badge.js';
import { boxTool, headerBoxTool } from './box.js';
import { breadcrumbTool } from './breadcrumb.js';
import { constrainTool } from './constrain.js';
import { createDocsTool, MCP_DOCS_CATALOG } from './docs.js';
import { dagTool } from './dag.js';
import { enumeratedListTool } from './enumerated-list.js';
import { explainabilityTool } from './explainability.js';
import { hyperlinkTool } from './hyperlink.js';
import { inspectorTool } from './inspector.js';
import { kbdTool } from './kbd.js';
import { logTool } from './log.js';
import { paginatorTool } from './paginator.js';
import { progressBarTool } from './progress.js';
import { separatorTool } from './separator.js';
import { skeletonTool } from './skeleton.js';
import { stepperTool } from './stepper.js';
import { tableTool } from './table.js';
import { tabsTool } from './tabs.js';
import { timelineTool } from './timeline.js';
import { treeTool } from './tree.js';

const ALL_TOOLS = [
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
] as const;

interface DocsPayloadEntry {
  readonly tool: string;
  readonly mcpExposed: boolean;
  readonly family: string;
  readonly exampleOutput?: string;
}

describe('bijou_docs tool', () => {
  it('returns the full catalog without examples by default', async () => {
    const docsTool = createDocsTool(ALL_TOOLS);
    const payload = JSON.parse((await docsTool.handler({})).content[0]!.text) as {
      documentedEntries: number;
      documentedTools: number;
      docsOnlyEntries: number;
      returnedEntries: number;
      includeExamples: boolean;
      entries: Array<Record<string, unknown>>;
    };

    expect(payload.documentedEntries).toBe(MCP_DOCS_CATALOG.length);
    expect(payload.documentedTools).toBe(ALL_TOOLS.length);
    expect(payload.docsOnlyEntries).toBe(MCP_DOCS_CATALOG.length - ALL_TOOLS.length);
    expect(payload.returnedEntries).toBe(MCP_DOCS_CATALOG.length);
    expect(payload.includeExamples).toBe(false);
    expect(payload.entries[0]).not.toHaveProperty('exampleOutput');
  });

  it('matches tool docs by query and renders example output for small result sets', async () => {
    const docsTool = createDocsTool(ALL_TOOLS);
    const payload = JSON.parse((await docsTool.handler({ query: 'table' })).content[0]!.text) as {
      includeExamples: boolean;
      entries: DocsPayloadEntry[];
    };

    expect(payload.includeExamples).toBe(true);
    expect(payload.entries.length).toBeGreaterThanOrEqual(1);
    expect(payload.entries[0]!.tool).toBe('bijou_table');
    expect(payload.entries[0]!.family).toBe('table()');
    expect(String(payload.entries[0]!.exampleOutput)).toContain('Service');
    expect(String(payload.entries[0]!.exampleOutput)).toContain('healthy');
  });

  it('returns docs-only entries with synthesized example output', async () => {
    const docsTool = createDocsTool(ALL_TOOLS);
    const payload = JSON.parse((await docsTool.handler({ query: 'markdown' })).content[0]!.text) as {
      includeExamples: boolean;
      entries: DocsPayloadEntry[];
    };

    expect(payload.includeExamples).toBe(true);
    expect(payload.entries.length).toBeGreaterThanOrEqual(1);
    expect(payload.entries[0]!.tool).toBe('bijou_markdown');
    expect(payload.entries[0]!.mcpExposed).toBe(false);
    expect(String(payload.entries[0]!.exampleOutput)).toContain('Release');
    expect(String(payload.entries[0]!.exampleOutput)).toContain('Build');
  });

  it('returns an empty entry set for unknown queries without throwing', async () => {
    const docsTool = createDocsTool(ALL_TOOLS);
    const payload = JSON.parse((await docsTool.handler({ query: 'definitely-missing-component' })).content[0]!.text) as {
      returnedEntries: number;
      entries: unknown[];
    };

    expect(payload.returnedEntries).toBe(0);
    expect(payload.entries).toEqual([]);
  });
});
