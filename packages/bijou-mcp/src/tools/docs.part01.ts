import type { GuidedFlowOptions, GuidedFlowSection, GuidedFlowStep, PreferenceRow, PreferenceRowKind, PreferenceSection, StatsPanelEntry } from '@flyingrobots/bijou';
import { numbers, strings, text } from './docs-values.js';
import type { ToolInteractionProfiles } from './docs-catalog/index.js';

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

function records(value: unknown): readonly Readonly<Record<string, unknown>>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Readonly<Record<string, unknown>> => (
      typeof item === 'object' && item !== null && !Array.isArray(item)
    ))
    : [];
}

function guidedFlowStepStatus(value: unknown): GuidedFlowStep['status'] {
  return value === 'complete' || value === 'current' || value === 'pending' ? value : undefined;
}

function docsGuidedFlowOptions(args: Record<string, unknown>): GuidedFlowOptions {
  return {
    title: text(args['title'], 'Guided flow'),
    label: text(args['label']),
    summary: text(args['summary']),
    metadata: strings(args['metadata']),
    steps: records(args['steps']).map((step): GuidedFlowStep => ({
      title: text(step['title'], 'Step'),
      detail: text(step['detail']),
      status: guidedFlowStepStatus(step['status']),
    })),
    sections: records(args['sections']).map((section): GuidedFlowSection => ({
      title: text(section['title'], 'Section'),
      content: text(section['content']),
      tone: section['tone'] === 'muted' ? 'muted' : 'normal',
    })),
    nextAction: text(args['nextAction']),
    nextActionLabel: text(args['nextActionLabel']),
    width: Number(args['width'] ?? 48),
  };
}

function preferenceRowKind(value: unknown): PreferenceRowKind | undefined {
  return value === 'toggle' || value === 'choice' || value === 'info' || value === 'action'
    ? value
    : undefined;
}

function docsPreferenceRows(value: unknown): readonly PreferenceRow[] {
  return records(value).map((row, rowIndex) => {
    const kind = preferenceRowKind(row['kind']);
    return {
      id: text(row['id'], `row-${String(rowIndex)}`),
      label: text(row['label'], 'Setting'),
      description: text(row['description']),
      valueLabel: text(row['valueLabel']),
      checked: row['checked'] === true,
      enabled: row['enabled'] !== false,
      ...(kind === undefined ? {} : { kind }),
    };
  });
}

function docsPreferenceSections(value: unknown): readonly PreferenceSection[] {
  return records(value).map((section, sectionIndex) => ({
    id: text(section['id'], `section-${String(sectionIndex)}`),
    title: text(section['title'], 'Settings'),
    rows: docsPreferenceRows(section['rows']),
  }));
}

function docsStatsPanelEntries(value: unknown): readonly StatsPanelEntry[] {
  return records(value).map((entry) => ({
    label: text(entry['label'], 'metric'),
    value: text(entry['value']),
    sparkline: numbers(entry['sparkline']),
  }));
}

export type { DocsOnlyExampleRenderer, SerializedToolDocsEntry };
export { docsGuidedFlowOptions, docsPreferenceSections, docsStatsPanelEntries };
