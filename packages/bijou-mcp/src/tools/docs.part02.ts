import { brailleChartSurface, guidedFlow, markdown, perfOverlaySurface, preferenceListSurface, sparkline, spinnerFrame, statsPanelSurface, stripAnsi, surfaceToString, timer } from '@flyingrobots/bijou';
import { plainStyle } from '@flyingrobots/bijou/adapters/test';
import { mcpContext } from '../context.js';
import { numbers, strings, text } from './docs-values.js';
import { docsGuidedFlowOptions, docsPreferenceSections, docsStatsPanelEntries } from './docs.part01.js';
import type { DocsOnlyExampleRenderer } from './docs.part01.js';

const DOCS_ONLY_EXAMPLE_RENDERERS: Readonly<Record<string, DocsOnlyExampleRenderer>> = {
  bijou_markdown: (args) => stripAnsi(markdown(text(args['source']), {
    width: typeof args['width'] === 'number' ? args['width'] : undefined,
    ctx: mcpContext(typeof args['width'] === 'number' ? args['width'] : undefined),
  })),
  bijou_note: (args) => {
    const title = typeof args['title'] === 'string' ? args['title'] : undefined;
    const message = text(args['message']);
    return title ? `Note (${title}): ${message}` : `Note: ${message}`;
  },
  bijou_guided_flow: (args) => stripAnsi(guidedFlow({
    ...docsGuidedFlowOptions(args),
    ctx: mcpContext(typeof args['width'] === 'number' ? args['width'] : undefined),
  })),
  bijou_preference_list: (args) => surfaceToString(preferenceListSurface(
    docsPreferenceSections(args['sections']),
    {
      width: Number(args['width'] ?? 40),
      selectedRowId: typeof args['selectedRowId'] === 'string' ? args['selectedRowId'] : undefined,
      ctx: mcpContext(typeof args['width'] === 'number' ? args['width'] : undefined),
    },
  ), plainStyle()),
  bijou_text_entry: (args) => {
    const inputTitle = text(args['inputTitle'], 'Cluster name');
    const inputDefault = text(args['inputDefault']);
    const textareaTitle = text(args['textareaTitle'], 'Details');
    const textareaValue = text(args['textareaValue']);
    return `${inputTitle}? [${inputDefault}]\n${textareaTitle}?\n${textareaValue}`;
  },
  bijou_single_choice: (args) => {
    const title = text(args['title'], 'Select one');
    const options = strings(args['options']);
    const selected = text(args['selected'], options[0] ?? '');
    const numbered = options.map((option, index) => `${String(index + 1)}. ${option}`).join('\n');
    const selectedIndex = Math.max(options.findIndex((option) => option === selected), 0) + 1;
    return `${title}?\n${numbered}\n> ${String(selectedIndex)}\nSelected: ${selected}`;
  },
  bijou_multiple_choice: (args) => {
    const title = text(args['title'], 'Select one or more');
    const options = strings(args['options']);
    const selected = new Set(strings(args['selected']));
    const lines = options.map((option) => `[${selected.has(option) ? 'x' : ' '}] ${option}`);
    return `${title}?\n${lines.join('\n')}\nSelected: ${Array.from(selected).join(', ')}`;
  },
  bijou_binary_decision: (args) => {
    const title = text(args['title'], 'Continue');
    const defaultValue = args['defaultValue'] === false ? '[y/N]' : '[Y/n]';
    const answer = text(args['answer']);
    return `${title}? ${defaultValue}\n> ${answer}`;
  },
  bijou_multi_field_forms: (args) => {
    const stepLabel = text(args['stepLabel'], 'Step 1 of 1');
    const stepTitle = text(args['stepTitle'], 'Details');
    const fields = strings(args['fields']);
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
    numbers(args['values']),
    { width: typeof args['width'] === 'number' ? args['width'] : undefined },
  ),
  bijou_braille_chart: (args) => surfaceToString(brailleChartSurface(
    numbers(args['values']),
    {
      width: Number(args['width'] ?? 0),
      height: Number(args['height'] ?? 0),
      ctx: mcpContext(typeof args['width'] === 'number' ? args['width'] : undefined),
    },
  ), plainStyle()),
  bijou_stats_panel: (args) => surfaceToString(statsPanelSurface(
    docsStatsPanelEntries(args['entries']),
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
      frameTimeHistory: numbers(args['frameTimeHistory']),
      width: Number(args['width'] ?? 80),
      height: Number(args['height'] ?? 24),
    },
    {
      title: typeof args['title'] === 'string' ? args['title'] : undefined,
      ctx: mcpContext(typeof args['width'] === 'number' ? args['width'] : undefined),
    },
  ), plainStyle()),
  bijou_branding: (args) => {
    const logo = text(args['logo'], 'BIJOU');
    const headline = text(args['headline']);
    return `${logo}\n${headline}`.trimEnd();
  },
  bijou_mode_aware_authoring: (args) => {
    const semanticThing = text(args['semanticThing'], 'semantic thing');
    return [
      `${semanticThing}:`,
      `interactive -> ${text(args['interactive'], '[rich output]')}`,
      `pipe -> ${text(args['pipe'], 'plain fallback')}`,
      `accessible -> ${text(args['accessible'], 'explicit reading-order fallback')}`,
    ].join('\n');
  },
};

function normalizeDocsTerm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export { DOCS_ONLY_EXAMPLE_RENDERERS, normalizeDocsTerm };
