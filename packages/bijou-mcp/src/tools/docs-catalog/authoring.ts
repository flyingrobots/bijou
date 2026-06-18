import type { ToolDocsCatalogEntry } from './types.js';

export const AUTHORING_DOCS_CATALOG: readonly ToolDocsCatalogEntry[] = [
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
    toolName: 'bijou_text_entry',
    family: 'input() / textarea()',
    category: 'Forms and Settings',
    summary: 'Short-form and multiline text-entry prompts for collecting authored input rather than choosing from a fixed set.',
    aliases: ['text entry', 'input', 'textarea', 'text field', 'free-form text'],
    useWhen: [
      'The user needs to enter original text rather than choose a predefined value.',
      'The difference between short-form and multiline entry matters to the task.',
    ],
    avoidWhen: [
      'The result is really a choice from a stable option set.',
      'A static content block or note would be more honest than an editable prompt.',
    ],
    related: ['select() / filter()', 'group() / wizard()', 'note()'],
    exampleArgs: {
      inputTitle: 'Cluster name',
      inputDefault: 'prod-us-west-2',
      textareaTitle: 'Rollback notes',
      textareaValue: 'Drain traffic\nPromote stable build',
    },
  },
  {
    toolName: 'bijou_single_choice',
    family: 'select() / filter()',
    category: 'Forms and Settings',
    summary: 'Single-choice prompt family for visible-list selection and searchable narrowing.',
    aliases: ['single choice', 'select', 'filter', 'dropdown', 'combo box'],
    useWhen: [
      'The user is choosing one durable value from a known option set.',
      'Search/narrowing helps, but the end result is still one selected value.',
    ],
    avoidWhen: [
      'The user is building a set rather than making one choice.',
      'The interaction is command dispatch rather than stored selection state.',
    ],
    related: ['multiselect()', 'input() / textarea()', 'group() / wizard()'],
    exampleArgs: {
      title: 'Release channel',
      options: ['stable', 'canary', 'nightly'],
      selected: 'canary',
    },
  },
  {
    toolName: 'bijou_multiple_choice',
    family: 'multiselect()',
    category: 'Forms and Settings',
    summary: 'Checkbox-style set builder for choosing several durable values.',
    aliases: ['multiple choice', 'multiselect', 'checkboxes', 'set selection'],
    useWhen: [
      'The user is building a set of selected values.',
      'The options read like members of one coherent collection.',
    ],
    avoidWhen: [
      'Only one choice is valid.',
      'The rows are commands or actions instead of lasting state.',
    ],
    related: ['select() / filter()', 'confirm()', 'group() / wizard()'],
    exampleArgs: {
      title: 'Deploy targets',
      options: ['api', 'web', 'worker'],
      selected: ['web', 'worker'],
    },
  },
  {
    toolName: 'bijou_binary_decision',
    family: 'confirm()',
    category: 'Forms and Settings',
    summary: 'Explicit yes-or-no confirmation prompt for genuinely binary decisions.',
    aliases: ['binary decision', 'confirm', 'yes no', 'confirmation'],
    useWhen: [
      'The choice is honestly binary and the consequence of yes versus no matters.',
      'A simple confirmation is clearer than a larger staged form.',
    ],
    avoidWhen: [
      'The user really has multiple options or tradeoffs to compare.',
      'The prompt needs rich evidence or explanation instead of a binary gate.',
    ],
    related: ['alert()', 'multiselect()', 'group() / wizard()'],
    exampleArgs: {
      title: 'Continue deployment',
      defaultValue: true,
      answer: 'y',
    },
  },
  {
    toolName: 'bijou_multi_field_forms',
    family: 'group() / wizard()',
    category: 'Forms and Settings',
    summary: 'Grouped and staged form orchestration for related inputs, progress, and branching flow.',
    aliases: ['group', 'wizard', 'multi-step form', 'staged form', 'grouped form'],
    useWhen: [
      'Several related inputs belong together under one goal or workflow.',
      'Progress, grouping, or branching matters more than one isolated prompt.',
    ],
    avoidWhen: [
      'The task only needs one simple field.',
      'The fields are unrelated and should not be bundled into one flow.',
    ],
    related: ['input() / textarea()', 'select() / filter()', 'confirm()', 'stepper()'],
    exampleArgs: {
      stepLabel: 'Step 2 of 3',
      stepTitle: 'Approval',
      fields: [
        'Cluster name? [prod-us-west-2]',
        'Release channel?',
        '1. stable',
        '2. canary',
        '3. nightly',
        '> 2',
        'Continue deployment? [Y/n]',
        '> y',
      ],
    },
  },
];
