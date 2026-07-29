import { z } from 'zod';
import { buildStructuredToolResult, structuredToolOutputShape, withOutputMode } from '../output.js';
import type { ToolRegistration, ToolResult } from '../types.js';
import { DEFAULT_DOCS_ONLY_INTERACTION_PROFILES, DEFAULT_INTERACTION_PROFILES, MCP_DOCS_CATALOG } from './docs-catalog/index.js';
import type { ToolDocsCatalogEntry, ToolInteractionProfiles } from './docs-catalog/index.js';
import type { SerializedToolDocsEntry } from './docs.part01.js';
import { DOCS_ONLY_EXAMPLE_RENDERERS, normalizeDocsTerm } from './docs.part02.js';

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
  return result.content[0]?.text
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
    description: 'Query machine-readable docs for bijou-mcp render tools and public first-party Bijou component families, including docs-only families before dedicated MCP renderers exist. Returns usage guidance, interaction profiles, related tools, sample input, and optional rendered example output.',
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
          result.exampleInput = entry.exampleArgs;
        }
        if (includeExamples && entry.exampleArgs !== undefined) {
          if (tool !== undefined) {
            result.exampleOutput = exampleText(await tool.handler(entry.exampleArgs));
          } else if (docsOnlyRenderer !== undefined) {
            result.exampleOutput = docsOnlyRenderer(entry.exampleArgs);
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
