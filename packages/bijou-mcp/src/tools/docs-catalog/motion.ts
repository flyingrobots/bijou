import type { ToolDocsCatalogEntry } from './types.js';

export const MOTION_DOCS_CATALOG: readonly ToolDocsCatalogEntry[] = [
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
  {
    toolName: 'bijou_branding',
    family: 'loadRandomLogo() / gradientText()',
    category: 'Narrative and Content',
    summary: 'Expressive branding helpers for deliberate splash, celebratory, and docs-opening moments.',
    aliases: ['branding', 'logo', 'gradient text', 'splash', 'hero'],
    useWhen: [
      'The interface needs a deliberate branded or celebratory moment.',
      'Expressive emphasis helps open or orient the experience without carrying critical state.',
    ],
    avoidWhen: [
      'Routine app chrome or task-critical labels need maximum scanability.',
      'Decoration would compete with the actual work or hide meaning behind color.',
    ],
    related: ['markdown()', 'box()', 'renderByMode()'],
    exampleArgs: {
      logo: 'BIJOU',
      headline: 'Release ready',
    },
  },
  {
    toolName: 'bijou_mode_aware_authoring',
    family: 'renderByMode()',
    category: 'Utility',
    summary: 'Authoring helper for building one semantic primitive that lowers honestly across output modes.',
    aliases: ['renderByMode', 'mode-aware primitive', 'custom primitive', 'lowering'],
    useWhen: [
      'An app needs a domain-specific primitive that does not belong in the shared component catalog.',
      'The same semantic thing must lower honestly across interactive, pipe, and accessible modes.',
    ],
    avoidWhen: [
      'An existing Bijou family already matches the job.',
      'Mode branching would only chase cosmetics instead of preserving meaning.',
    ],
    related: ['note()', 'badge()', 'markdown()'],
    exampleArgs: {
      semanticThing: 'build health',
      interactive: '[build][healthy]',
      pipe: 'build health: healthy',
      accessible: 'Build health is healthy.',
    },
  },
];
