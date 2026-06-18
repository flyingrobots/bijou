import { z } from 'zod';
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

const docsPayloadEntrySchema = z.object({
  tool: z.string(),
  mcpExposed: z.boolean(),
  family: z.string(),
  exampleOutput: z.string().optional(),
}).passthrough();
const docsPayloadSchema = z.object({
  documentedEntries: z.number().optional(),
  documentedTools: z.number().optional(),
  docsOnlyEntries: z.number().optional(),
  returnedEntries: z.number(),
  includeExamples: z.boolean().optional(),
  entries: z.array(docsPayloadEntrySchema),
}).passthrough();

function parseDocsPayload(result: Awaited<ReturnType<ReturnType<typeof createDocsTool>['handler']>>) {
  const text = result.content[0]?.text;
  if (text === undefined) throw new Error('Expected bijou_docs to return text content');
  const parsed: unknown = JSON.parse(text);
  return docsPayloadSchema.parse(parsed);
}

const EXPECTED_DOCS_ONLY_FAMILIES = [
  'note()',
  'input() / textarea()',
  'select() / filter()',
  'multiselect()',
  'confirm()',
  'group() / wizard()',
  'loadRandomLogo() / gradientText()',
  'renderByMode()',
] as const;

describe('bijou_docs tool', () => {
  it('returns the full catalog without examples by default', async () => {
    const docsTool = createDocsTool(ALL_TOOLS);
    const payload = parseDocsPayload(await docsTool.handler({}));

    expect(payload.documentedEntries).toBe(MCP_DOCS_CATALOG.length);
    expect(payload.documentedTools).toBe(ALL_TOOLS.length);
    expect(payload.docsOnlyEntries).toBe(MCP_DOCS_CATALOG.length - ALL_TOOLS.length);
    expect(payload.returnedEntries).toBe(MCP_DOCS_CATALOG.length);
    expect(payload.includeExamples).toBe(false);
    expect(payload.entries[0]).not.toHaveProperty('exampleOutput');
    for (const family of EXPECTED_DOCS_ONLY_FAMILIES) {
      expect(payload.entries.some((entry) => entry.family === family)).toBe(true);
    }
  });

  it('matches tool docs by query and renders example output for small result sets', async () => {
    const docsTool = createDocsTool(ALL_TOOLS);
    const payload = parseDocsPayload(await docsTool.handler({ query: 'table' }));
    const entry = payload.entries[0];

    expect(payload.includeExamples).toBe(true);
    expect(payload.entries.length).toBeGreaterThanOrEqual(1);
    expect(entry?.tool).toBe('bijou_table');
    expect(entry?.family).toBe('table()');
    expect(entry?.exampleOutput).toContain('Service');
    expect(entry?.exampleOutput).toContain('healthy');
  });

  it('returns docs-only entries with synthesized example output', async () => {
    const docsTool = createDocsTool(ALL_TOOLS);
    const payload = parseDocsPayload(await docsTool.handler({ query: 'markdown' }));
    const entry = payload.entries[0];

    expect(payload.includeExamples).toBe(true);
    expect(payload.entries.length).toBeGreaterThanOrEqual(1);
    expect(entry?.tool).toBe('bijou_markdown');
    expect(entry?.mcpExposed).toBe(false);
    expect(entry?.exampleOutput).toContain('Release');
    expect(entry?.exampleOutput).toContain('Build');
  });

  it('documents the staged form family with a synthesized prompt snapshot', async () => {
    const docsTool = createDocsTool(ALL_TOOLS);
    const payload = parseDocsPayload(await docsTool.handler({ query: 'wizard' }));
    const entry = payload.entries[0];

    expect(payload.includeExamples).toBe(true);
    expect(payload.entries.length).toBeGreaterThanOrEqual(1);
    expect(entry?.tool).toBe('bijou_multi_field_forms');
    expect(entry?.mcpExposed).toBe(false);
    expect(entry?.exampleOutput).toContain('Step 2 of 3');
    expect(entry?.exampleOutput).toContain('Continue deployment? [Y/n]');
  });

  it('documents the mode-aware authoring helper as a docs-only family', async () => {
    const docsTool = createDocsTool(ALL_TOOLS);
    const payload = parseDocsPayload(await docsTool.handler({ query: 'renderByMode' }));
    const entry = payload.entries[0];

    expect(payload.includeExamples).toBe(true);
    expect(payload.entries.length).toBeGreaterThanOrEqual(1);
    expect(entry?.tool).toBe('bijou_mode_aware_authoring');
    expect(entry?.mcpExposed).toBe(false);
    expect(entry?.exampleOutput).toContain('interactive ->');
    expect(entry?.exampleOutput).toContain('accessible ->');
  });

  it('returns an empty entry set for unknown queries without throwing', async () => {
    const docsTool = createDocsTool(ALL_TOOLS);
    const payload = parseDocsPayload(await docsTool.handler({ query: 'definitely-missing-component' }));

    expect(payload.returnedEntries).toBe(0);
    expect(payload.entries).toEqual([]);
  });
});
