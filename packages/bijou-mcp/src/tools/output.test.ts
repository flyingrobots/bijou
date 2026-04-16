import { describe, expect, it } from 'vitest';
import { accordionTool } from './accordion.js';
import { alertTool } from './alert.js';
import { badgeTool } from './badge.js';
import { boxTool, headerBoxTool } from './box.js';
import { breadcrumbTool } from './breadcrumb.js';
import { constrainTool } from './constrain.js';
import { createDocsTool } from './docs.js';
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

describe('MCP structured output modes', () => {
  it('render tools return text content by default and structured content alongside it', async () => {
    const result = await dagTool.handler({
      nodes: [
        { id: 'a', label: 'Parse', edges: ['b'] },
        { id: 'b', label: 'Compile' },
      ],
    });

    expect(result.content[0]?.type).toBe('text');
    expect(result.content[0]?.text).toContain('Parse');
    expect(result.structuredContent).toMatchObject({
      output: 'text',
      data: {
        nodes: [
          { id: 'a', label: 'Parse', edges: ['b'] },
          { id: 'b', label: 'Compile' },
        ],
      },
    });
    expect(typeof result.structuredContent?.['rendered']).toBe('string');
  });

  it('render tools can return machine-readable data without text content', async () => {
    const result = await dagTool.handler({
      nodes: [
        { id: 'a', label: 'Parse', edges: ['b'] },
        { id: 'b', label: 'Compile' },
      ],
      output: 'data',
    });

    expect(result.content).toEqual([]);
    expect(result.structuredContent).toMatchObject({
      output: 'data',
      data: {
        nodes: [
          { id: 'a', label: 'Parse', edges: ['b'] },
          { id: 'b', label: 'Compile' },
        ],
      },
    });
    expect(result.structuredContent).not.toHaveProperty('rendered');
  });

  it('bijou_docs supports both text and structured payloads', async () => {
    const docsTool = createDocsTool(ALL_TOOLS);
    const result = await docsTool.handler({ query: 'dag', output: 'both' });
    const structured = result.structuredContent as Record<string, unknown>;
    const payload = structured['data'] as Record<string, unknown>;
    const entries = payload['entries'] as Array<Record<string, unknown>>;

    expect(result.content[0]?.type).toBe('text');
    expect(result.content[0]?.text).toContain('"tool": "bijou_dag"');
    expect(structured['output']).toBe('both');
    expect(structured['rendered']).toBe(result.content[0]?.text);
    expect(Number(payload['returnedEntries'])).toBeGreaterThanOrEqual(1);
    expect(entries[0]?.['tool']).toBe('bijou_dag');
  });
});
