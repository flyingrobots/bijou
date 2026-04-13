import { z } from 'zod';
import type { ToolRegistration, ToolResult } from '../types.js';

interface ToolInteractionProfiles {
  readonly interactive: string;
  readonly static: string;
  readonly pipe: string;
  readonly accessible: string;
}

interface ToolDocsCatalogEntry {
  readonly toolName: string;
  readonly family: string;
  readonly category: string;
  readonly summary: string;
  readonly aliases: readonly string[];
  readonly useWhen: readonly string[];
  readonly avoidWhen: readonly string[];
  readonly interactionProfiles?: Partial<ToolInteractionProfiles>;
  readonly related: readonly string[];
  readonly exampleArgs: Record<string, unknown>;
}

interface SerializedToolDocsEntry {
  readonly tool: string;
  readonly family: string;
  readonly category: string;
  readonly summary: string;
  readonly useWhen: readonly string[];
  readonly avoidWhen: readonly string[];
  readonly interactionProfiles: ToolInteractionProfiles;
  readonly related: readonly string[];
  readonly aliases: readonly string[];
  exampleInput?: Record<string, unknown>;
  exampleOutput?: string;
}

const DEFAULT_INTERACTION_PROFILES: ToolInteractionProfiles = {
  interactive: 'Rendered through a plain-style interactive context with Unicode structure and no ANSI color.',
  static: 'Matches the interactive MCP output because the wrapper returns a plain-text rendering rather than a live terminal state.',
  pipe: 'Not separately lowered by the MCP wrapper; the returned result is already plain text suitable for logs, prompts, and transcripts.',
  accessible: 'No dedicated accessible lowering is exposed by this MCP wrapper yet, so callers should treat the plain-text structure as the accessible fallback.',
};

export const MCP_DOCS_CATALOG: readonly ToolDocsCatalogEntry[] = [
  {
    toolName: 'bijou_table',
    family: 'table()',
    category: 'Data and Structure',
    summary: 'Rectangular data grid with headers and box-drawing borders.',
    aliases: ['table', 'grid', 'rows', 'columns'],
    useWhen: [
      'Your data is naturally row-and-column shaped.',
      'People need to compare values across consistent fields.',
    ],
    avoidWhen: [
      'The structure is hierarchical rather than tabular.',
      'You need narrative prose more than aligned comparison.',
    ],
    related: ['dag()', 'tree()', 'enumeratedList()'],
    exampleArgs: {
      columns: [{ header: 'Service' }, { header: 'Status' }],
      rows: [['api', 'healthy'], ['worker', 'healthy']],
      width: 40,
    },
  },
  {
    toolName: 'bijou_tree',
    family: 'tree()',
    category: 'Data and Structure',
    summary: 'Nested hierarchy with Unicode connectors.',
    aliases: ['tree', 'hierarchy', 'outline', 'nested'],
    useWhen: [
      'The data has parent-child nesting.',
      'Expansion order matters more than cross-node comparison.',
    ],
    avoidWhen: [
      'You need many-to-many relationships or cross-links.',
      'The data is better scanned as rows and columns.',
    ],
    related: ['dag()', 'enumeratedList()', 'table()'],
    exampleArgs: {
      nodes: [
        {
          label: 'docs',
          children: [{ label: 'design-system' }, { label: 'release' }],
        },
      ],
    },
  },
  {
    toolName: 'bijou_dag',
    family: 'dag()',
    category: 'Data and Structure',
    summary: 'Directed graph with boxed nodes and routed edges.',
    aliases: ['dag', 'graph', 'dependency graph', 'flow graph'],
    useWhen: [
      'Relationships are graph-shaped rather than purely hierarchical.',
      'You need to show dependencies, branches, or converging flows.',
    ],
    avoidWhen: [
      'A linear timeline or step list would explain the flow more clearly.',
      'The structure is simple enough for a tree or breadcrumb.',
    ],
    related: ['tree()', 'timeline()', 'table()'],
    exampleArgs: {
      nodes: [
        { id: 'build', label: 'Build', edges: ['test'] },
        { id: 'test', label: 'Test', edges: ['deploy'] },
        { id: 'deploy', label: 'Deploy' },
      ],
      maxWidth: 60,
    },
  },
  {
    toolName: 'bijou_enumerated_list',
    family: 'enumeratedList()',
    category: 'Data and Structure',
    summary: 'List renderer for bullets, ordered steps, letters, or roman numerals.',
    aliases: ['enumerated list', 'list', 'bullet list', 'ordered list'],
    useWhen: [
      'You need a lightweight ordered or unordered list.',
      'Sequence matters but rich container chrome would be overkill.',
    ],
    avoidWhen: [
      'Items need per-row metadata or aligned fields.',
      'The structure is better represented as tabs, steps, or a tree.',
    ],
    related: ['stepper()', 'timeline()', 'table()'],
    exampleArgs: {
      items: ['Build', 'Test', 'Deploy'],
      style: 'arabic',
    },
  },
  {
    toolName: 'bijou_box',
    family: 'box()',
    category: 'Containers and Layout',
    summary: 'Generic bordered container for prose, status, or grouped content.',
    aliases: ['box', 'panel', 'container'],
    useWhen: [
      'Content needs a visible boundary or title.',
      'You want a neutral container that does not imply workflow state.',
    ],
    avoidWhen: [
      'The content wants a more opinionated component such as alert or inspector.',
      'The output is simple enough to stay as plain text.',
    ],
    related: ['headerBox()', 'alert()', 'inspector()'],
    exampleArgs: {
      content: 'Release ready for canary.',
      title: 'status',
    },
  },
  {
    toolName: 'bijou_header_box',
    family: 'headerBox()',
    category: 'Containers and Layout',
    summary: 'Compact labeled container with a heading and optional detail line.',
    aliases: ['header box', 'summary panel', 'heading panel'],
    useWhen: [
      'A compact callout needs a strong label up front.',
      'You want a container with more voice than a generic box.',
    ],
    avoidWhen: [
      'You need multi-section detail instead of a headline summary.',
      'The content is only one line and does not need chrome.',
    ],
    related: ['box()', 'inspector()', 'alert()'],
    exampleArgs: {
      label: 'Release',
      detail: 'stable',
    },
  },
  {
    toolName: 'bijou_separator',
    family: 'separator()',
    category: 'Containers and Layout',
    summary: 'Horizontal rule with optional centered label.',
    aliases: ['separator', 'divider', 'rule'],
    useWhen: [
      'You need a clear break between sections.',
      'A short label should orient the next block of content.',
    ],
    avoidWhen: [
      'You need an actual container rather than a visual divider.',
      'The surrounding layout already makes section boundaries obvious.',
    ],
    related: ['box()', 'headerBox()', 'tabs()'],
    exampleArgs: {
      label: 'release queue',
      width: 32,
    },
  },
  {
    toolName: 'bijou_constrain',
    family: 'constrain()',
    category: 'Containers and Layout',
    summary: 'Text truncation helper for bounded width and height.',
    aliases: ['constrain', 'truncate', 'clamp', 'ellipsis'],
    useWhen: [
      'Free-form text must fit a strict width or height.',
      'A preview should stay honest without rewriting the source text.',
    ],
    avoidWhen: [
      'You actually need wrapping instead of truncation.',
      'The source content is important enough to merit a scrollable container.',
    ],
    related: ['box()', 'markdown()', 'table()'],
    exampleArgs: {
      content: 'This is a long release note preview that should be clipped before it overruns the surrounding layout.',
      maxWidth: 26,
    },
  },
  {
    toolName: 'bijou_alert',
    family: 'alert()',
    category: 'Feedback and Status',
    summary: 'Severity callout with icon and bordered container.',
    aliases: ['alert', 'warning', 'error', 'success', 'info'],
    useWhen: [
      'A message needs strong severity signaling.',
      'The reader should treat the content as a callout rather than ambient copy.',
    ],
    avoidWhen: [
      'You need transient notification behavior rather than a static panel.',
      'The state is low-stakes enough for a badge or note.',
    ],
    related: ['badge()', 'log()', 'explainability()'],
    exampleArgs: {
      message: 'Canary error budget is almost exhausted.',
      variant: 'warning',
    },
  },
  {
    toolName: 'bijou_progress_bar',
    family: 'progressBar()',
    category: 'Feedback and Status',
    summary: 'Static completion bar with optional percent label.',
    aliases: ['progress', 'progress bar', 'percent', 'completion'],
    useWhen: [
      'A single bounded percentage is the important state.',
      'You need a compact progress signal inside another surface.',
    ],
    avoidWhen: [
      'The workflow has named steps rather than a pure percent.',
      'The state is indeterminate and should be shown as loading instead.',
    ],
    related: ['stepper()', 'timeline()', 'skeleton()'],
    exampleArgs: {
      percent: 72,
      width: 20,
    },
  },
  {
    toolName: 'bijou_stepper',
    family: 'stepper()',
    category: 'Feedback and Status',
    summary: 'Horizontal step-progress indicator with completed and active states.',
    aliases: ['stepper', 'steps', 'wizard progress', 'workflow'],
    useWhen: [
      'The process has named sequential stages.',
      'You want to show both completed and upcoming steps.',
    ],
    avoidWhen: [
      'The flow branches or loops like a graph.',
      'Only a raw percentage matters.',
    ],
    related: ['timeline()', 'progressBar()', 'tabs()'],
    exampleArgs: {
      steps: [{ label: 'Build' }, { label: 'Test' }, { label: 'Deploy' }],
      current: 1,
    },
  },
  {
    toolName: 'bijou_timeline',
    family: 'timeline()',
    category: 'Feedback and Status',
    summary: 'Vertical sequence of timestamp-like events with status markers.',
    aliases: ['timeline', 'history', 'event stream', 'chronology'],
    useWhen: [
      'Order over time is the main story.',
      'Each event needs a short label and optional detail.',
    ],
    avoidWhen: [
      'The relationship is graph-shaped rather than sequential.',
      'You only need the current step, not the event history.',
    ],
    related: ['stepper()', 'log()', 'dag()'],
    exampleArgs: {
      events: [
        { label: 'Build', status: 'success' },
        { label: 'Deploy', description: 'Canary 25%', status: 'active' },
      ],
    },
  },
  {
    toolName: 'bijou_log',
    family: 'log()',
    category: 'Feedback and Status',
    summary: 'Single structured log line with severity treatment.',
    aliases: ['log', 'log line', 'event', 'status line'],
    useWhen: [
      'You need terse operational events.',
      'Severity should be visible without a full alert box.',
    ],
    avoidWhen: [
      'The message needs explanation, evidence, or grouped detail.',
      'You are rendering a multi-row history rather than one event.',
    ],
    related: ['timeline()', 'alert()', 'badge()'],
    exampleArgs: {
      level: 'info',
      message: 'Deployment completed.',
    },
  },
  {
    toolName: 'bijou_badge',
    family: 'badge()',
    category: 'Feedback and Status',
    summary: 'Compact inline status pill.',
    aliases: ['badge', 'pill', 'status chip', 'label'],
    useWhen: [
      'A short state label should stay inline with surrounding content.',
      'You need low-chrome categorical emphasis.',
    ],
    avoidWhen: [
      'The message needs body text or explanation.',
      'The state changes over time and deserves a richer progress surface.',
    ],
    related: ['alert()', 'log()', 'progressBar()'],
    exampleArgs: {
      text: 'LIVE',
      variant: 'success',
    },
  },
  {
    toolName: 'bijou_tabs',
    family: 'tabs()',
    category: 'Navigation',
    summary: 'Horizontal section switcher with one active tab.',
    aliases: ['tabs', 'tab bar', 'sections', 'navigation tabs'],
    useWhen: [
      'People switch between peer views or sections.',
      'One active choice should be visible at a glance.',
    ],
    avoidWhen: [
      'The choices are sequential workflow steps.',
      'The navigation is path-like rather than peer-to-peer.',
    ],
    related: ['breadcrumb()', 'paginator()', 'stepper()'],
    exampleArgs: {
      items: [{ label: 'Overview' }, { label: 'Logs' }, { label: 'Settings' }],
      active: 1,
    },
  },
  {
    toolName: 'bijou_breadcrumb',
    family: 'breadcrumb()',
    category: 'Navigation',
    summary: 'Path trail showing where the current surface sits inside a hierarchy.',
    aliases: ['breadcrumb', 'path', 'location trail'],
    useWhen: [
      'Location context matters more than peer switching.',
      'You need to show depth inside a hierarchy.',
    ],
    avoidWhen: [
      'Users choose between peer views rather than nested locations.',
      'The hierarchy is dense enough to need a tree.',
    ],
    related: ['tabs()', 'tree()', 'paginator()'],
    exampleArgs: {
      items: ['Home', 'Docs', 'API'],
    },
  },
  {
    toolName: 'bijou_paginator',
    family: 'paginator()',
    category: 'Navigation',
    summary: 'Compact indicator for current page or viewport position.',
    aliases: ['paginator', 'pagination', 'page indicator', 'page dots'],
    useWhen: [
      'The user needs lightweight position awareness across pages.',
      'Full tabs or breadcrumbs would be too heavy for the surface.',
    ],
    avoidWhen: [
      'Page labels matter more than page count.',
      'The navigation is hierarchical rather than sequential.',
    ],
    related: ['tabs()', 'breadcrumb()', 'stepper()'],
    exampleArgs: {
      current: 2,
      total: 5,
      style: 'dots',
    },
  },
  {
    toolName: 'bijou_explainability',
    family: 'explainability()',
    category: 'Rich Panels',
    summary: 'Decision card with rationale, evidence, confidence, and next action.',
    aliases: ['explainability', 'explanation', 'decision card', 'ai rationale'],
    useWhen: [
      'A recommendation or decision needs supporting evidence.',
      'You want the reader to audit reasoning, not just accept output.',
    ],
    avoidWhen: [
      'The content is simple status or prose without structured rationale.',
      'A generic box or inspector already carries enough context.',
    ],
    related: ['inspector()', 'alert()', 'note()'],
    exampleArgs: {
      title: 'Choose table()',
      label: 'Recommendation',
      rationale: 'The data is rectangular and the reader needs aligned field comparison.',
      evidence: [
        { label: 'Shape', value: 'rows × columns' },
        { label: 'Need', value: 'compare values side by side' },
      ],
      confidence: 'high',
    },
  },
  {
    toolName: 'bijou_inspector',
    family: 'inspector()',
    category: 'Rich Panels',
    summary: 'Detail panel with a primary value and structured supporting sections.',
    aliases: ['inspector', 'detail panel', 'detail view', 'property panel'],
    useWhen: [
      'A single object or resource needs focused inspection.',
      'You need a primary value plus labeled supporting sections.',
    ],
    avoidWhen: [
      'The content is really an alert or recommendation.',
      'A flat table or list is enough.',
    ],
    related: ['explainability()', 'box()', 'headerBox()'],
    exampleArgs: {
      title: 'Service',
      currentValue: 'healthy',
      currentValueLabel: 'Status',
      supportingText: 'us-west-2',
      supportingTextLabel: 'Region',
      sections: [{ title: 'Deploy', content: 'Canary complete.' }],
    },
  },
  {
    toolName: 'bijou_accordion',
    family: 'accordion()',
    category: 'Rich Panels',
    summary: 'Collapsible sections for progressive disclosure.',
    aliases: ['accordion', 'collapsible', 'disclosure', 'expand/collapse'],
    useWhen: [
      'Not every section should be open at once.',
      'The reader benefits from progressive disclosure.',
    ],
    avoidWhen: [
      'Everything should remain visible together for comparison.',
      'The user is switching peer views rather than expanding sections.',
    ],
    related: ['tabs()', 'inspector()', 'box()'],
    exampleArgs: {
      sections: [
        { title: 'Deploy', content: 'Roll canaries to 25%.', expanded: true },
        { title: 'Rollback', content: 'Restore the previous stable build.' },
      ],
    },
  },
  {
    toolName: 'bijou_kbd',
    family: 'kbd()',
    category: 'Utility',
    summary: 'Keyboard keycap renderer for inline shortcut hints.',
    aliases: ['kbd', 'keycap', 'shortcut key', 'keyboard hint'],
    useWhen: [
      'You need to show a shortcut inline.',
      'The key label should read like UI chrome rather than plain prose.',
    ],
    avoidWhen: [
      'The shortcut is incidental and plain text is enough.',
      'You need a full help table rather than one key hint.',
    ],
    related: ['hyperlink()', 'badge()', 'tabs()'],
    exampleArgs: {
      key: 'Ctrl+P',
    },
  },
  {
    toolName: 'bijou_hyperlink',
    family: 'hyperlink()',
    category: 'Utility',
    summary: 'Terminal hyperlink with explicit plain-text fallback behavior.',
    aliases: ['hyperlink', 'link', 'url', 'osc 8'],
    useWhen: [
      'The destination matters and should stay explicit.',
      'A plain-text fallback still needs to make sense when OSC 8 is unavailable.',
    ],
    avoidWhen: [
      'You are just styling text without a destination.',
      'The raw URL alone is clearer than link text.',
    ],
    related: ['kbd()', 'markdown()', 'box()'],
    exampleArgs: {
      text: 'Bijou docs',
      url: 'https://github.com/flyingrobots/bijou',
    },
  },
  {
    toolName: 'bijou_skeleton',
    family: 'skeleton()',
    category: 'Utility',
    summary: 'Placeholder loading surface for still-unavailable content.',
    aliases: ['skeleton', 'placeholder', 'loading', 'shimmer'],
    useWhen: [
      'Content is loading and the future shape matters.',
      'You need a compact visual placeholder rather than a spinner alone.',
    ],
    avoidWhen: [
      'The state is determinate enough for a progress bar or stepper.',
      'The load is instantaneous and placeholder chrome adds noise.',
    ],
    related: ['progressBar()', 'badge()', 'alert()'],
    exampleArgs: {
      width: 24,
      lines: 2,
    },
  },
];

function normalizeDocsTerm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function scoreDocsEntry(entry: ToolDocsCatalogEntry, normalizedQuery: string): number {
  if (normalizedQuery === '') return 1;
  const primaryFields = [
    entry.toolName,
    entry.family,
    entry.category,
    ...entry.aliases,
  ].map(normalizeDocsTerm);
  const secondaryFields = [
    entry.summary,
    ...entry.related,
  ].map(normalizeDocsTerm);
  if (primaryFields.some(value => value === normalizedQuery)) return 100;
  if (primaryFields.some(value => value.startsWith(normalizedQuery))) return 80;
  let score = primaryFields.some(value => value.includes(normalizedQuery)) ? 40 : 0;
  if (secondaryFields.some(value => value === normalizedQuery)) score += 20;
  if (secondaryFields.some(value => value.includes(normalizedQuery))) score += 10;
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    if (primaryFields.some(value => value.includes(token))) score += 10;
    else if (secondaryFields.some(value => value.includes(token))) score += 4;
  }
  return score;
}

function exampleText(result: ToolResult): string {
  return result.content.find((block) => block.type === 'text')?.text ?? '';
}

function resolvedInteractionProfiles(
  entry: ToolDocsCatalogEntry,
): ToolInteractionProfiles {
  return {
    ...DEFAULT_INTERACTION_PROFILES,
    ...entry.interactionProfiles,
  };
}

export function createDocsTool(tools: readonly ToolRegistration[]): ToolRegistration {
  const toolMap = new Map(tools.map(tool => [tool.name, tool]));
  const documentedTools = MCP_DOCS_CATALOG.map((entry) => {
    const tool = toolMap.get(entry.toolName);
    if (tool === undefined) {
      throw new Error(`[bijou-mcp] bijou_docs catalog entry "${entry.toolName}" has no matching tool registration`);
    }
    return { entry, tool };
  });

  const inputShape = {
    query: z.string().optional().describe('Tool or component query (for example "table", "dag", or "progress").'),
    limit: z.number().int().positive().max(50).optional().describe('Maximum number of entries to return.'),
    includeExamples: z.boolean().optional().describe('Include rendered example output and sample input for the returned entries. Defaults to true when the result set is small.'),
  };
  const inputSchema = z.object(inputShape);

  return {
    name: 'bijou_docs',
    description: 'Query machine-readable documentation for the component and utility tools exposed by bijou-mcp. Returns usage guidance, interaction-profile notes, related tools, sample input, and optional rendered example output.',
    inputSchema: inputShape,
    handler: async (args) => {
      const input = inputSchema.parse(args);
      const normalizedQuery = normalizeDocsTerm(input.query ?? '');
      const ranked = documentedTools
        .map(({ entry, tool }) => ({
          entry,
          tool,
          score: scoreDocsEntry(entry, normalizedQuery),
        }))
        .filter(({ score }) => normalizedQuery === '' || score > 0)
        .sort((a, b) => b.score - a.score || a.entry.family.localeCompare(b.entry.family));

      const limit = input.limit ?? (normalizedQuery === '' ? ranked.length : 3);
      const selected = ranked.slice(0, limit);
      const includeExamples = input.includeExamples ?? normalizedQuery !== '';

      const entries = await Promise.all(selected.map(async ({ entry, tool }) => {
        const result: SerializedToolDocsEntry = {
          tool: entry.toolName,
          family: entry.family,
          category: entry.category,
          summary: entry.summary,
          useWhen: entry.useWhen,
          avoidWhen: entry.avoidWhen,
          interactionProfiles: resolvedInteractionProfiles(entry),
          related: entry.related,
          aliases: entry.aliases,
        };
        if (includeExamples) {
          result['exampleInput'] = entry.exampleArgs;
          result['exampleOutput'] = exampleText(await tool.handler(entry.exampleArgs));
        }
        return result;
      }));

      const payload = {
        scope: 'bijou-mcp',
        note: 'This catalog currently covers the component and utility surface that bijou-mcp exposes today. Broader DOGFOOD-level field-guide extraction remains future expansion.',
        documentedTools: documentedTools.length,
        returnedEntries: entries.length,
        query: input.query ?? null,
        includeExamples,
        entries,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
      };
    },
  };
}
