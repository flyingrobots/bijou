import type { ToolDocsCatalogEntry } from './types.js';

export const WORKFLOW_DOCS_CATALOG: readonly ToolDocsCatalogEntry[] = [
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
];
