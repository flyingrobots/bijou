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
  readonly exampleArgs?: Record<string, unknown>;
}

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

const DEFAULT_INTERACTION_PROFILES: ToolInteractionProfiles = {
  interactive: 'Rendered through a plain-style interactive context with Unicode structure and no ANSI color.',
  static: 'Matches the interactive MCP output because the wrapper returns a plain-text rendering rather than a live terminal state.',
  pipe: 'Not separately lowered by the MCP wrapper; the returned result is already plain text suitable for logs, prompts, and transcripts.',
  accessible: 'No dedicated accessible lowering is exposed by this MCP wrapper yet, so callers should treat the plain-text structure as the accessible fallback.',
};

const DEFAULT_DOCS_ONLY_INTERACTION_PROFILES: ToolInteractionProfiles = {
  interactive: 'No dedicated MCP render tool is exposed today. bijou_docs documents this first-party family directly and can synthesize a representative plain-text example when examples are requested.',
  static: 'Matches the docs-only interactive sample because bijou_docs returns a plain-text reference rendering rather than a live terminal session.',
  pipe: 'The synthesized example output is already plain text suitable for logs, prompts, and transcripts.',
  accessible: 'No dedicated accessible lowering is exposed for this docs-only entry yet, so callers should treat the plain-text sample and guidance as the accessible fallback.',
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
  {
    toolName: 'bijou_markdown',
    family: 'markdown()',
    category: 'Narrative and Content',
    summary: 'Mode-aware terminal markdown renderer for headings, lists, code blocks, links, and quotes.',
    aliases: ['markdown', 'md', 'rich text', 'docs prose'],
    useWhen: [
      'Source text already exists as markdown and should stay authored that way.',
      'You need headings, lists, quotes, and inline emphasis without rebuilding the prose by hand.',
    ],
    avoidWhen: [
      'The content is structured data that should be table-, tree-, or graph-shaped.',
      'You need one focused callout rather than a narrative document block.',
    ],
    related: ['hyperlink()', 'box()', 'guidedFlow()'],
    exampleArgs: {
      source: '# Release\n\n- Build\n- Test\n- Deploy',
      width: 32,
    },
  },
  {
    toolName: 'bijou_guided_flow',
    family: 'guidedFlow()',
    category: 'Narrative and Content',
    summary: 'Structured explainability block for posture, steps, sections, and next action.',
    aliases: ['guided flow', 'runbook', 'operator guide', 'playbook'],
    useWhen: [
      'Readers need a guided operational story instead of an undifferentiated text dump.',
      'You want summary, steps, supporting sections, and a next action inside one coherent block.',
    ],
    avoidWhen: [
      'A lightweight list, table, or alert would explain the state more directly.',
      'The content is free-form markdown rather than a guided operational flow.',
    ],
    related: ['explainability()', 'markdown()', 'stepper()'],
    exampleArgs: {
      title: 'Release canary',
      label: 'Flow',
      summary: 'Roll canaries to 25% before global promote.',
      steps: [
        { title: 'Build', status: 'complete' },
        { title: 'Canary', status: 'current', detail: 'Watch error budget for 15 minutes.' },
        { title: 'Promote', status: 'pending' },
      ],
      nextAction: 'Hold at 25% until latency stays green.',
      width: 48,
    },
  },
  {
    toolName: 'bijou_preference_list',
    family: 'preferenceListSurface()',
    category: 'Forms and Settings',
    summary: 'Structured settings list with toggles, actions, descriptions, and selected-row state.',
    aliases: ['preference list', 'settings list', 'preferences', 'settings panel'],
    useWhen: [
      'Settings need sectioned rows, values, and secondary descriptions.',
      'A shell or page needs a settings surface rather than an ad hoc list of toggles.',
    ],
    avoidWhen: [
      'You only need one or two status pills or buttons.',
      'The content is narrative guidance rather than configurable rows.',
    ],
    related: ['tabs()', 'box()', 'guidedFlow()'],
    exampleArgs: {
      sections: [
        {
          id: 'shell',
          title: 'Shell',
          rows: [
            { id: 'theme', label: 'Theme', valueLabel: 'Verdant Plum', kind: 'choice' },
            { id: 'perf', label: 'Perf HUD', checked: true, kind: 'toggle', description: 'Show development perf overlay.' },
          ],
        },
      ],
      width: 42,
      selectedRowId: 'perf',
    },
  },
  {
    toolName: 'bijou_spinner',
    family: 'spinnerFrame() / createSpinner()',
    category: 'Feedback and Status',
    summary: 'Inline spinner glyphs and live spinner controller for indeterminate work.',
    aliases: ['spinner', 'loading spinner', 'busy indicator', 'working'],
    useWhen: [
      'Work is in flight but there is no honest percentage yet.',
      'You need a compact live-status affordance rather than a large placeholder.',
    ],
    avoidWhen: [
      'Progress is determinate enough for a progress bar or stepper.',
      'The load state wants a full skeleton or empty-state narrative instead.',
    ],
    related: ['progressBar()', 'skeleton()', 'timer()'],
    exampleArgs: {
      tick: 3,
      label: 'Build',
    },
  },
  {
    toolName: 'bijou_timer',
    family: 'timer() / createTimer() / createStopwatch()',
    category: 'Feedback and Status',
    summary: 'Static and live timer family for countdowns, stopwatches, and elapsed-time readouts.',
    aliases: ['timer', 'countdown', 'stopwatch', 'elapsed time'],
    useWhen: [
      'Time remaining or elapsed time is the core signal.',
      'You need a compact time readout that can degrade across output modes.',
    ],
    avoidWhen: [
      'The user needs task progression rather than wall-clock duration.',
      'A timestamp label is enough and no live timer semantics are needed.',
    ],
    related: ['progressBar()', 'spinnerFrame() / createSpinner()', 'perfOverlaySurface()'],
    exampleArgs: {
      ms: 150000,
      label: 'Deploy',
    },
  },
  {
    toolName: 'bijou_sparkline',
    family: 'sparkline()',
    category: 'Data Visualization',
    summary: 'Compact inline trend graph using Unicode block characters.',
    aliases: ['sparkline', 'inline chart', 'trend line', 'micro chart'],
    useWhen: [
      'You need a tiny trend summary inline with a metric.',
      'A full chart would be too heavy for the available space.',
    ],
    avoidWhen: [
      'The chart needs axes, dense labels, or higher detail.',
      'The audience needs exact values rather than a quick trend read.',
    ],
    related: ['brailleChartSurface()', 'statsPanelSurface()', 'perfOverlaySurface()'],
    exampleArgs: {
      values: [1, 5, 3, 8, 2, 7],
      width: 8,
    },
  },
  {
    toolName: 'bijou_braille_chart',
    family: 'brailleChartSurface()',
    category: 'Data Visualization',
    summary: 'High-density filled area chart using Unicode Braille sub-pixels.',
    aliases: ['braille chart', 'area chart', 'dense chart', 'tiny chart'],
    useWhen: [
      'You need more visual density than a sparkline can provide.',
      'The chart should stay text-native but still show trend shape clearly.',
    ],
    avoidWhen: [
      'Exact values or labeled axes matter more than density.',
      'A single metric trend is compact enough for sparkline().',
    ],
    related: ['sparkline()', 'statsPanelSurface()', 'perfOverlaySurface()'],
    exampleArgs: {
      values: [1, 4, 2, 8, 3, 7, 5],
      width: 16,
      height: 4,
    },
  },
  {
    toolName: 'bijou_stats_panel',
    family: 'statsPanelSurface()',
    category: 'Data Visualization',
    summary: 'Aligned metrics panel with labels, values, and optional inline sparklines.',
    aliases: ['stats panel', 'metrics panel', 'telemetry panel', 'perf panel'],
    useWhen: [
      'Several metrics belong together inside one compact panel.',
      'Labels, values, and small trends should stay aligned and readable.',
    ],
    avoidWhen: [
      'You only need one metric and a badge or inline value would do.',
      'The content is narrative or workflow guidance rather than telemetry.',
    ],
    related: ['sparkline()', 'brailleChartSurface()', 'perfOverlaySurface()'],
    exampleArgs: {
      entries: [
        { label: 'FPS', value: '60' },
        { label: 'frame', value: '16.7 ms', sparkline: [15.8, 16.1, 16.7, 16.4, 17.0] },
      ],
      title: 'Perf',
      width: 28,
    },
  },
  {
    toolName: 'bijou_perf_overlay',
    family: 'perfOverlaySurface()',
    category: 'Data Visualization',
    summary: 'Prebuilt performance dashboard combining a stats panel and braille chart.',
    aliases: ['perf overlay', 'performance overlay', 'telemetry overlay', 'fps overlay'],
    useWhen: [
      'You need an immediately useful perf HUD without composing several primitives yourself.',
      'Frame timing, terminal size, and memory should be visible together as one overlay.',
    ],
    avoidWhen: [
      'The app only needs one inline metric or a small sparkline.',
      'The shell should stay clean and no telemetry overlay belongs on screen.',
    ],
    related: ['statsPanelSurface()', 'brailleChartSurface()', 'sparkline()'],
    exampleArgs: {
      fps: 60,
      frameTimeMs: 16.7,
      frameTimeHistory: [15.8, 16.1, 16.7, 16.4, 17.0],
      width: 80,
      height: 24,
      title: 'Perf',
    },
  },
];

type DocsOnlyExampleRenderer = (args: Record<string, unknown>) => string;

const DOCS_ONLY_EXAMPLE_RENDERERS: Readonly<Record<string, DocsOnlyExampleRenderer>> = {
  bijou_markdown: (args) => stripAnsi(markdown(String(args['source'] ?? ''), {
    width: typeof args['width'] === 'number' ? args['width'] : undefined,
    ctx: mcpContext(typeof args['width'] === 'number' ? args['width'] : undefined),
  })),
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
    description: 'Query machine-readable documentation for bijou-mcp render tools plus selected first-party Bijou component families that do not yet have a dedicated MCP renderer. Returns usage guidance, interaction-profile notes, related tools, sample input, and optional rendered example output.',
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
        note: 'This catalog covers the current bijou-mcp render-tool surface plus selected first-party Bijou component families that are documented here before they gain dedicated MCP render tools. Broader DOGFOOD-level field-guide extraction remains future expansion.',
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
