import { z } from 'zod';
import {
  brailleChartSurface,
  guidedFlow,
  markdown,
  perfOverlaySurface,
  preferenceListSurface,
  sparkline,
  spinnerFrame,
  statsPanelSurface,
  stripAnsi,
  surfaceToString,
  timer,
} from '@flyingrobots/bijou';
import { plainStyle } from '@flyingrobots/bijou/adapters/test';
import { mcpContext } from '../context.js';
import {
  buildStructuredToolResult,
  structuredToolOutputShape,
  withOutputMode,
} from '../output.js';
import type { ToolRegistration, ToolResult } from '../types.js';
import {
  DEFAULT_DOCS_ONLY_INTERACTION_PROFILES,
  DEFAULT_INTERACTION_PROFILES,
  MCP_DOCS_CATALOG,
  type ToolDocsCatalogEntry,
  type ToolInteractionProfiles,
} from './docs-catalog/index.js';

export { MCP_DOCS_CATALOG } from './docs-catalog/index.js';

interface SerializedToolDocsEntry {
  readonly tool: string;
  readonly mcpExposed: boolean;
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

type DocsOnlyExampleRenderer = (args: Record<string, unknown>) => string;

const DOCS_ONLY_EXAMPLE_RENDERERS: Readonly<Record<string, DocsOnlyExampleRenderer>> = {
  bijou_markdown: (args) => stripAnsi(markdown(String(args['source'] ?? ''), {
    width: typeof args['width'] === 'number' ? args['width'] : undefined,
    ctx: mcpContext(typeof args['width'] === 'number' ? args['width'] : undefined),
  })),
  bijou_note: (args) => {
    const title = typeof args['title'] === 'string' ? args['title'] : undefined;
    const message = String(args['message'] ?? '');
    return title ? `Note (${title}): ${message}` : `Note: ${message}`;
  },
  bijou_guided_flow: (args) => stripAnsi(guidedFlow({
    ...(args as unknown as Parameters<typeof guidedFlow>[0]),
    ctx: mcpContext(typeof args['width'] === 'number' ? args['width'] : undefined),
  })),
  bijou_preference_list: (args) => surfaceToString(preferenceListSurface(
    args['sections'] as Parameters<typeof preferenceListSurface>[0],
    {
      width: Number(args['width'] ?? 40),
      selectedRowId: typeof args['selectedRowId'] === 'string' ? args['selectedRowId'] : undefined,
      ctx: mcpContext(typeof args['width'] === 'number' ? args['width'] : undefined),
    },
  ), plainStyle()),
  bijou_text_entry: (args) => {
    const inputTitle = String(args['inputTitle'] ?? 'Cluster name');
    const inputDefault = String(args['inputDefault'] ?? '');
    const textareaTitle = String(args['textareaTitle'] ?? 'Details');
    const textareaValue = String(args['textareaValue'] ?? '');
    return `${inputTitle}? [${inputDefault}]\n${textareaTitle}?\n${textareaValue}`;
  },
  bijou_single_choice: (args) => {
    const title = String(args['title'] ?? 'Select one');
    const options = Array.isArray(args['options']) ? args['options'].map(String) : [];
    const selected = String(args['selected'] ?? options[0] ?? '');
    const numbered = options.map((option, index) => `${index + 1}. ${option}`).join('\n');
    const selectedIndex = Math.max(options.findIndex((option) => option === selected), 0) + 1;
    return `${title}?\n${numbered}\n> ${selectedIndex}\nSelected: ${selected}`;
  },
  bijou_multiple_choice: (args) => {
    const title = String(args['title'] ?? 'Select one or more');
    const options = Array.isArray(args['options']) ? args['options'].map(String) : [];
    const selected = new Set(
      Array.isArray(args['selected']) ? args['selected'].map(String) : [],
    );
    const lines = options.map((option) => `[${selected.has(option) ? 'x' : ' '}] ${option}`);
    return `${title}?\n${lines.join('\n')}\nSelected: ${Array.from(selected).join(', ')}`;
  },
  bijou_binary_decision: (args) => {
    const title = String(args['title'] ?? 'Continue');
    const defaultValue = args['defaultValue'] === false ? '[y/N]' : '[Y/n]';
    const answer = String(args['answer'] ?? '');
    return `${title}? ${defaultValue}\n> ${answer}`;
  },
  bijou_multi_field_forms: (args) => {
    const stepLabel = String(args['stepLabel'] ?? 'Step 1 of 1');
    const stepTitle = String(args['stepTitle'] ?? 'Details');
    const fields = Array.isArray(args['fields']) ? args['fields'].map(String) : [];
    return `${stepLabel}: ${stepTitle}\n${fields.join('\n')}`;
  },
  bijou_spinner: (args) => spinnerFrame(Number(args['tick'] ?? 0), {
    label: typeof args['label'] === 'string' ? args['label'] : undefined,
  }),
  bijou_timer: (args) => stripAnsi(timer(Number(args['ms'] ?? 0), {
    label: typeof args['label'] === 'string' ? args['label'] : undefined,
    ctx: mcpContext(),
  })),
  bijou_sparkline: (args) => sparkline(
    (args['values'] as readonly number[] | undefined) ?? [],
    { width: typeof args['width'] === 'number' ? args['width'] : undefined },
  ),
  bijou_braille_chart: (args) => surfaceToString(brailleChartSurface(
    (args['values'] as readonly number[] | undefined) ?? [],
    {
      width: Number(args['width'] ?? 0),
      height: Number(args['height'] ?? 0),
      ctx: mcpContext(typeof args['width'] === 'number' ? args['width'] : undefined),
    },
  ), plainStyle()),
  bijou_stats_panel: (args) => surfaceToString(statsPanelSurface(
    (args['entries'] as Parameters<typeof statsPanelSurface>[0]) ?? [],
    {
      title: typeof args['title'] === 'string' ? args['title'] : undefined,
      width: Number(args['width'] ?? 28),
      ctx: mcpContext(typeof args['width'] === 'number' ? args['width'] : undefined),
    },
  ), plainStyle()),
  bijou_perf_overlay: (args) => surfaceToString(perfOverlaySurface(
    {
      fps: Number(args['fps'] ?? 0),
      frameTimeMs: Number(args['frameTimeMs'] ?? 0),
      frameTimeHistory: (args['frameTimeHistory'] as readonly number[] | undefined) ?? [],
      width: Number(args['width'] ?? 80),
      height: Number(args['height'] ?? 24),
    },
    {
      title: typeof args['title'] === 'string' ? args['title'] : undefined,
      ctx: mcpContext(typeof args['width'] === 'number' ? args['width'] : undefined),
    },
  ), plainStyle()),
  bijou_branding: (args) => {
    const logo = String(args['logo'] ?? 'BIJOU');
    const headline = String(args['headline'] ?? '');
    return `${logo}\n${headline}`.trimEnd();
  },
  bijou_mode_aware_authoring: (args) => {
    const semanticThing = String(args['semanticThing'] ?? 'semantic thing');
    return [
      `${semanticThing}:`,
      `interactive -> ${String(args['interactive'] ?? '[rich output]')}`,
      `pipe -> ${String(args['pipe'] ?? 'plain fallback')}`,
      `accessible -> ${String(args['accessible'] ?? 'explicit reading-order fallback')}`,
    ].join('\n');
  },
};

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
  return result.content.find((block) => block.type === 'text')?.text
    ?? (typeof result.structuredContent?.['rendered'] === 'string'
      ? result.structuredContent['rendered']
      : '');
}

function resolvedInteractionProfiles(
  entry: ToolDocsCatalogEntry,
  mcpExposed: boolean,
): ToolInteractionProfiles {
  return {
    ...(mcpExposed ? DEFAULT_INTERACTION_PROFILES : DEFAULT_DOCS_ONLY_INTERACTION_PROFILES),
    ...entry.interactionProfiles,
  };
}

export function createDocsTool(tools: readonly ToolRegistration[]): ToolRegistration {
  const toolMap = new Map(tools.map(tool => [tool.name, tool]));
  const documentedEntries = MCP_DOCS_CATALOG.map((entry) => {
    const tool = toolMap.get(entry.toolName);
    const docsOnlyRenderer = DOCS_ONLY_EXAMPLE_RENDERERS[entry.toolName];
    if (tool === undefined && docsOnlyRenderer === undefined) {
      throw new Error(`[bijou-mcp] bijou_docs catalog entry "${entry.toolName}" has no matching tool registration or docs-only example renderer`);
    }
    return { entry, tool, docsOnlyRenderer, mcpExposed: tool !== undefined };
  });

  const inputShape = withOutputMode({
    query: z.string().optional().describe('Tool or component query (for example "table", "dag", or "progress").'),
    limit: z.number().int().positive().max(50).optional().describe('Maximum number of entries to return.'),
    includeExamples: z.boolean().optional().describe('Include rendered example output and sample input for the returned entries. Defaults to true when the result set is small.'),
  });
  const inputSchema = z.object(inputShape);

  return {
    name: 'bijou_docs',
    description: 'Query machine-readable documentation for the bijou-mcp render-tool surface plus the full public first-party Bijou component-family surface, including docs-only families that do not yet have dedicated MCP renderers. Returns usage guidance, interaction-profile notes, related tools, sample input, and optional rendered example output.',
    inputSchema: inputShape,
    outputSchema: structuredToolOutputShape,
    handler: async (args) => {
      const input = inputSchema.parse(args);
      const normalizedQuery = normalizeDocsTerm(input.query ?? '');
      const ranked = documentedEntries
        .map(({ entry, tool, docsOnlyRenderer, mcpExposed }) => ({
          entry,
          tool,
          docsOnlyRenderer,
          mcpExposed,
          score: scoreDocsEntry(entry, normalizedQuery),
        }))
        .filter(({ score }) => normalizedQuery === '' || score > 0)
        .sort((a, b) => b.score - a.score || a.entry.family.localeCompare(b.entry.family));

      const limit = input.limit ?? (normalizedQuery === '' ? ranked.length : 3);
      const selected = ranked.slice(0, limit);
      const includeExamples = input.includeExamples ?? normalizedQuery !== '';

      const entries = await Promise.all(selected.map(async ({ entry, tool, docsOnlyRenderer, mcpExposed }) => {
        const result: SerializedToolDocsEntry = {
          tool: entry.toolName,
          mcpExposed,
          family: entry.family,
          category: entry.category,
          summary: entry.summary,
          useWhen: entry.useWhen,
          avoidWhen: entry.avoidWhen,
          interactionProfiles: resolvedInteractionProfiles(entry, mcpExposed),
          related: entry.related,
          aliases: entry.aliases,
        };
        if (entry.exampleArgs !== undefined) {
          result['exampleInput'] = entry.exampleArgs;
        }
        if (includeExamples && entry.exampleArgs !== undefined) {
          if (tool !== undefined) {
            result['exampleOutput'] = exampleText(await tool.handler(entry.exampleArgs));
          } else if (docsOnlyRenderer !== undefined) {
            result['exampleOutput'] = docsOnlyRenderer(entry.exampleArgs);
          }
        }
        return result;
      }));

      const payload = {
        scope: 'bijou-mcp',
        note: 'This catalog covers the current bijou-mcp render-tool surface plus the public first-party Bijou component-family surface, including docs-only families that are documented here before they gain dedicated MCP render tools. Broader DOGFOOD-level field-guide extraction remains future expansion.',
        documentedEntries: documentedEntries.length,
        documentedTools: documentedEntries.filter(({ mcpExposed }) => mcpExposed).length,
        docsOnlyEntries: documentedEntries.filter(({ mcpExposed }) => !mcpExposed).length,
        returnedEntries: entries.length,
        query: input.query ?? null,
        includeExamples,
        entries,
      };

      return buildStructuredToolResult(
        JSON.stringify(payload, null, 2),
        payload,
        input.output ?? 'text',
      );
    },
  };
}
