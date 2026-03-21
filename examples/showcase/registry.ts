import type { BijouContext, DagNode, TreeNode, TimelineEvent } from '@flyingrobots/bijou';
import {
  alert,
  badge,
  box,
  headerBox,
  separator,
  skeleton,
  kbd,
  hyperlink,
  log,
  gradientText,
  progressBar,
  spinnerFrame,
  table,
  tree,
  accordion,
  timeline,
  tabs,
  breadcrumb,
  paginator,
  stepper,
  dag,
  enumeratedList,
  markdown,
  surfaceToString,
} from '@flyingrobots/bijou';
import type { ComponentEntry } from './types.js';

function badgeText(label: string, variant: Parameters<typeof badge>[1]['variant'], ctx: BijouContext): string {
  return surfaceToString(badge(label, { variant, ctx }), ctx.style);
}

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const SAMPLE_TREE: TreeNode[] = [
  {
    label: 'src',
    children: [
      { label: 'index.ts' },
      {
        label: 'components',
        children: [
          { label: 'box.ts' },
          { label: 'badge.ts' },
        ],
      },
    ],
  },
  { label: 'package.json' },
  { label: 'tsconfig.json' },
];

const SAMPLE_TIMELINE: TimelineEvent[] = [
  { label: 'Planning', status: 'success' },
  { label: 'Development', status: 'active' },
  { label: 'Review', status: 'warning' },
  { label: 'Release', status: 'muted' },
];

const SAMPLE_DAG: DagNode[] = [
  { id: 'plan', label: 'Plan', edges: ['dev', 'design'], badge: 'done' },
  { id: 'design', label: 'Design', edges: ['dev'], badge: 'done' },
  { id: 'dev', label: 'Develop', edges: ['test'], badge: 'active' },
  { id: 'test', label: 'Test', edges: ['ship'], badge: 'pending' },
  { id: 'ship', label: 'Ship', badge: 'pending' },
];

// ---------------------------------------------------------------------------
// Display components
// ---------------------------------------------------------------------------

const DISPLAY: ComponentEntry[] = [
  {
    id: 'box',
    name: 'box() / headerBox()',
    subtitle: 'Bordered containers',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# box() / headerBox()',
      '',
      'Unicode box-drawing containers with optional titles, padding, width override,',
      'and background surface tokens. `headerBox()` adds a label + detail header.',
      '',
      '**Degradation:** Rich shows borders. Pipe returns content only. Accessible returns content only.',
    ].join('\n'),
    render: (w, ctx) => [
      box('A simple bordered box.', { width: Math.min(40, w), ctx }),
      '',
      headerBox('Deploy', { detail: 'v1.2.3 -> production', ctx }),
    ].join('\n'),
  },
  {
    id: 'alert',
    name: 'alert()',
    subtitle: 'Boxed alerts with icons',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# alert()',
      '',
      'Boxed notification alerts with status icons and variant coloring.',
      'Variants: `info`, `success`, `warning`, `error`.',
      '',
      '**Degradation:** Rich shows bordered box with icon. Pipe/accessible show text with prefix.',
    ].join('\n'),
    render: (w, ctx) => [
      alert('Deployment successful.', { variant: 'success', ctx }),
      '',
      alert('Check your configuration.', { variant: 'warning', ctx }),
      '',
      alert('Connection refused on port 5432.', { variant: 'error', ctx }),
    ].join('\n'),
  },
  {
    id: 'badge',
    name: 'badge()',
    subtitle: 'Inline status badges (7 variants)',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# badge()',
      '',
      'Compact inline status indicators. Inverse-colored pills.',
      'Variants: `success`, `error`, `warning`, `info`, `muted`, `accent`, `primary`.',
      '',
      '**Degradation:** Rich shows colored pill. Pipe shows plain text. Accessible shows `[TEXT]` brackets.',
    ].join('\n'),
    render: (_w, ctx) => [
      [
        badgeText('SUCCESS', 'success', ctx),
        badgeText('ERROR', 'error', ctx),
        badgeText('WARNING', 'warning', ctx),
      ].join('  '),
      [
        badgeText('INFO', 'info', ctx),
        badgeText('MUTED', 'muted', ctx),
        badgeText('ACCENT', 'accent', ctx),
        badgeText('PRIMARY', 'primary', ctx),
      ].join('  '),
      '',
      `Server is ${badgeText('RUNNING', 'success', ctx)} on port ${badgeText('3000', 'primary', ctx)}`,
    ].join('\n'),
  },
  {
    id: 'separator',
    name: 'separator()',
    subtitle: 'Horizontal dividers with labels',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# separator()',
      '',
      'Horizontal rule dividers with optional centered labels.',
      '',
      '**Degradation:** Rich shows styled line. Pipe shows dashes. Accessible shows dashes.',
    ].join('\n'),
    render: (w, ctx) => [
      separator({ width: Math.min(40, w), ctx }),
      '',
      separator({ label: 'Section Title', width: Math.min(40, w), ctx }),
      '',
      separator({ label: 'Another', width: Math.min(40, w), ctx }),
    ].join('\n'),
  },
  {
    id: 'skeleton',
    name: 'skeleton()',
    subtitle: 'Loading placeholders',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# skeleton()',
      '',
      'Animated shimmer-style loading placeholders for content that has not loaded yet.',
      '',
      '**Degradation:** Rich shows shaded blocks. Pipe/accessible show placeholder dashes.',
    ].join('\n'),
    render: (w, ctx) => [
      skeleton({ width: Math.min(30, w), height: 1, ctx }),
      skeleton({ width: Math.min(20, w), height: 1, ctx }),
      skeleton({ width: Math.min(25, w), height: 1, ctx }),
      '',
      skeleton({ width: Math.min(40, w), height: 3, ctx }),
    ].join('\n'),
  },
  {
    id: 'kbd',
    name: 'kbd()',
    subtitle: 'Keyboard shortcut display',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# kbd()',
      '',
      'Rendered keyboard shortcut badges, styled like physical key caps.',
      '',
      '**Degradation:** Rich shows styled key. Pipe/accessible show `[key]` brackets.',
    ].join('\n'),
    render: (_w, ctx) => [
      `${kbd('Ctrl', { ctx })}+${kbd('C', { ctx })} to quit`,
      `${kbd('Tab', { ctx })} to switch focus`,
      `${kbd('?', { ctx })} for help`,
      `${kbd('Esc', { ctx })} to cancel`,
    ].join('\n'),
  },
  {
    id: 'hyperlink',
    name: 'hyperlink()',
    subtitle: 'Clickable terminal links (OSC 8)',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# hyperlink()',
      '',
      'Clickable OSC 8 terminal hyperlinks. Falls back to `text (url)` in terminals',
      'that do not support the protocol.',
      '',
      '**Degradation:** Rich shows clickable link. Pipe/accessible show `text (url)`.',
    ].join('\n'),
    render: (_w, ctx) => [
      hyperlink('Bijou on GitHub', 'https://github.com/flyingrobots/bijou', { ctx }),
      hyperlink('Documentation', 'https://bijou.dev/docs', { ctx }),
    ].join('\n'),
  },
  {
    id: 'log',
    name: 'log()',
    subtitle: 'Leveled styled output',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# log()',
      '',
      'Leveled log output with status-colored prefixes.',
      'Levels: `debug`, `info`, `warn`, `error`, `fatal`.',
      '',
      '**Degradation:** Rich shows colored prefix. Pipe shows `[LEVEL]` prefix. Accessible same as pipe.',
    ].join('\n'),
    render: (_w, ctx) => [
      log('debug', 'Connecting to database...', { ctx }),
      log('info', 'Server started on port 3000', { ctx }),
      log('warn', 'Deprecated API used in /v1/users', { ctx }),
      log('error', 'Connection refused: ECONNREFUSED', { ctx }),
      log('fatal', 'Unrecoverable state — shutting down', { ctx }),
    ].join('\n'),
  },
  {
    id: 'gradient-text',
    name: 'gradientText()',
    subtitle: 'Gradient-colored text',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# gradientText()',
      '',
      'Apply RGB color gradients to text strings.',
      '',
      '**Degradation:** Rich shows gradient. Pipe/accessible return plain text.',
    ].join('\n'),
    render: (_w, ctx) => [
      gradientText('Hello, beautiful terminal!', { ctx }),
      gradientText('Bijou Component Library', { ctx }),
    ].join('\n'),
  },
  {
    id: 'progress-bar',
    name: 'progressBar()',
    subtitle: 'Static progress indicators',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# progressBar()',
      '',
      'Horizontal progress bar at a given percentage.',
      '',
      '**Degradation:** Rich shows colored bar. Pipe shows `[==>  ] 45%`. Accessible shows `Progress: 45%`.',
    ].join('\n'),
    render: (w, ctx) => {
      const barWidth = Math.min(36, w - 2);
      return [
        progressBar(25, { width: barWidth, ctx }),
        progressBar(50, { width: barWidth, ctx }),
        progressBar(75, { width: barWidth, ctx }),
        progressBar(100, { width: barWidth, ctx }),
      ].join('\n');
    },
  },
  {
    id: 'spinner',
    name: 'spinnerFrame()',
    subtitle: 'Animated spinner frames',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# spinnerFrame()',
      '',
      'Returns a single frame of a spinner animation. Call with incrementing',
      'frame index from a `tick()` command for animation.',
      '',
      '**Degradation:** Rich shows animated glyph. Pipe/accessible show static text.',
    ].join('\n'),
    render: (_w, ctx) => [
      `Frame 0: ${spinnerFrame(0, { ctx })} Loading...`,
      `Frame 1: ${spinnerFrame(1, { ctx })} Loading...`,
      `Frame 2: ${spinnerFrame(2, { ctx })} Loading...`,
      `Frame 3: ${spinnerFrame(3, { ctx })} Loading...`,
    ].join('\n'),
  },
];

// ---------------------------------------------------------------------------
// Data components
// ---------------------------------------------------------------------------

const DATA: ComponentEntry[] = [
  {
    id: 'table',
    name: 'table()',
    subtitle: 'Data tables with columns',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# table()',
      '',
      'Tabular data display with typed columns, alignment, and width constraints.',
      '',
      '**Degradation:** Rich shows bordered table. Pipe shows TSV. Accessible shows row-label format.',
    ].join('\n'),
    render: (w, ctx) => table({
      columns: [
        { header: 'Name', width: Math.min(14, Math.floor(w / 4)) },
        { header: 'Role', width: Math.min(12, Math.floor(w / 4)) },
        { header: 'Status', width: Math.min(10, Math.floor(w / 4)) },
      ],
      rows: [
        ['Alice', 'Engineer', 'active'],
        ['Bob', 'Designer', 'away'],
        ['Carol', 'PM', 'offline'],
      ],
      ctx,
    }),
  },
  {
    id: 'tree',
    name: 'tree()',
    subtitle: 'Hierarchical tree views',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# tree()',
      '',
      'Indented tree display with unicode branch characters.',
      '',
      '**Degradation:** Rich shows styled tree lines. Pipe shows ASCII tree. Accessible shows indented list.',
    ].join('\n'),
    render: (_w, ctx) => tree(SAMPLE_TREE, { ctx }),
  },
  {
    id: 'accordion',
    name: 'accordion()',
    subtitle: 'Expandable content sections',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# accordion()',
      '',
      'Static expandable/collapsible content sections. For interactive accordion,',
      'see `interactiveAccordion()` in bijou-tui.',
      '',
      '**Degradation:** Rich shows styled headers. Pipe/accessible show text sections.',
    ].join('\n'),
    render: (_w, ctx) => accordion([
      { title: 'Getting Started', content: 'Install with npm install @flyingrobots/bijou', expanded: true },
      { title: 'Configuration', content: 'Set BIJOU_THEME env var to choose a preset.', expanded: false },
      { title: 'Advanced', content: 'Use createBijou() for custom port wiring.', expanded: false },
    ], { ctx }),
  },
  {
    id: 'timeline',
    name: 'timeline()',
    subtitle: 'Event timelines with status',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# timeline()',
      '',
      'Vertical timeline with status-colored markers.',
      'Statuses: `success`, `active`, `warning`, `muted`.',
      '',
      '**Degradation:** Rich shows colored dots + lines. Pipe shows `[STATUS] label`. Accessible same as pipe.',
    ].join('\n'),
    render: (_w, ctx) => timeline(SAMPLE_TIMELINE, { ctx }),
  },
  {
    id: 'tabs',
    name: 'tabs()',
    subtitle: 'Tab bar navigation',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# tabs()',
      '',
      'Static tab bar with active tab highlighting and optional badge counts.',
      '',
      '**Degradation:** Rich shows styled tabs. Pipe shows `[active] inactive`. Accessible shows labeled list.',
    ].join('\n'),
    render: (_w, ctx) => [
      tabs([
        { label: 'Overview', active: true },
        { label: 'Files', badge: '12' },
        { label: 'Settings' },
      ], { ctx }),
      '',
      tabs([
        { label: 'Home' },
        { label: 'Dashboard', active: true, badge: '3' },
        { label: 'Logs' },
      ], { ctx }),
    ].join('\n'),
  },
  {
    id: 'breadcrumb',
    name: 'breadcrumb()',
    subtitle: 'Navigation breadcrumb trails',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# breadcrumb()',
      '',
      'Horizontal navigation breadcrumb with separator characters.',
      '',
      '**Degradation:** Rich shows styled path. Pipe/accessible show slash-separated text.',
    ].join('\n'),
    render: (_w, ctx) => [
      breadcrumb(['Home', 'Projects', 'Bijou', 'src'], { ctx }),
      breadcrumb(['Settings', 'Theme', 'Colors'], { ctx }),
    ].join('\n'),
  },
  {
    id: 'paginator',
    name: 'paginator()',
    subtitle: 'Page indicators (dots and text)',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# paginator()',
      '',
      'Dot-style or text-style page indicators.',
      '',
      '**Degradation:** Rich shows styled dots. Pipe/accessible show `Page X of Y`.',
    ].join('\n'),
    render: (_w, ctx) => [
      paginator({ current: 0, total: 5, ctx }),
      paginator({ current: 2, total: 5, ctx }),
      paginator({ current: 4, total: 5, ctx }),
    ].join('\n'),
  },
  {
    id: 'stepper',
    name: 'stepper()',
    subtitle: 'Step progress indicators',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# stepper()',
      '',
      'Multi-step progress indicator showing completed, active, and pending steps.',
      '',
      '**Degradation:** Rich shows styled steps. Pipe/accessible show numbered step list.',
    ].join('\n'),
    render: (_w, ctx) => stepper([
      { label: 'Account', status: 'complete' },
      { label: 'Profile', status: 'active' },
      { label: 'Review', status: 'pending' },
      { label: 'Done', status: 'pending' },
    ], { ctx }),
  },
  {
    id: 'dag',
    name: 'dag()',
    subtitle: 'Directed acyclic graph',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# dag()',
      '',
      'ASCII art directed acyclic graph with status badges, edge routing,',
      'node selection, and highlight paths.',
      '',
      '**Degradation:** Rich shows colored graph. Pipe shows ASCII art. Accessible shows dependency list.',
    ].join('\n'),
    render: (w, ctx) => dag(SAMPLE_DAG, {
      selectedId: 'dev',
      highlightPath: ['plan', 'dev', 'test', 'ship'],
      maxWidth: Math.max(50, w),
      ctx,
    }),
  },
  {
    id: 'enumerated-list',
    name: 'enumeratedList()',
    subtitle: 'Ordered/unordered lists',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# enumeratedList()',
      '',
      'Numbered or bulleted lists with 6 bullet styles:',
      '`arabic`, `alpha`, `roman`, `bullet`, `dash`, `none`.',
      '',
      '**Degradation:** All modes render similarly (text-based).',
    ].join('\n'),
    render: (_w, ctx) => [
      enumeratedList(['First item', 'Second item', 'Third item'], { style: 'arabic', ctx }),
      '',
      enumeratedList(['Alpha one', 'Alpha two', 'Alpha three'], { style: 'alpha', ctx }),
      '',
      enumeratedList(['Bullet point', 'Another point'], { style: 'bullet', ctx }),
    ].join('\n'),
  },
  {
    id: 'markdown',
    name: 'markdown()',
    subtitle: 'Terminal markdown renderer',
    pkg: 'bijou',
    tier: 1,
    description: [
      '# markdown()',
      '',
      'Renders markdown in the terminal with headings, bold/italic,',
      'code blocks, blockquotes, links, and lists.',
      '',
      '**Degradation:** Rich shows styled markdown. Pipe shows plain text. Accessible shows simplified text.',
    ].join('\n'),
    render: (w, ctx) => markdown([
      '## Hello World',
      '',
      'This is **bold** and *italic* text.',
      '',
      '> A blockquote with wisdom.',
      '',
      '```ts',
      'const x = 42;',
      '```',
      '',
      '- Item one',
      '- Item two',
    ].join('\n'), { width: Math.min(50, w), ctx }),
  },
];

// ---------------------------------------------------------------------------
// Form components (TIER 3 — static preview only)
// ---------------------------------------------------------------------------

const FORMS: ComponentEntry[] = [
  {
    id: 'select',
    name: 'select()',
    subtitle: 'Single-select menu',
    pkg: 'bijou',
    tier: 3,
    description: [
      '# select()',
      '',
      'Interactive single-selection menu with keyboard navigation.',
      'Arrow keys move the cursor, Enter selects.',
      '',
      '**Interactive component** — cannot be embedded in this showcase.',
      'Run standalone to try it:',
      '',
      '```sh',
      'npx tsx examples/select/main.ts',
      '```',
    ].join('\n'),
    render: (w, ctx) => box([
      '  ? Pick a color',
      '',
      '  > Red       (highlighted)',
      '    Blue',
      '    Green',
      '    Yellow',
      '',
      '  (arrow keys navigate, enter selects)',
    ].join('\n'), { width: Math.min(40, w), ctx }),
  },
  {
    id: 'multiselect',
    name: 'multiselect()',
    subtitle: 'Checkbox multi-select',
    pkg: 'bijou',
    tier: 3,
    description: [
      '# multiselect()',
      '',
      'Interactive multi-selection with checkboxes. Space toggles,',
      'Enter confirms. Supports `maxVisible` scrolling.',
      '',
      '**Interactive component** — run standalone:',
      '',
      '```sh',
      'npx tsx examples/multiselect/main.ts',
      '```',
    ].join('\n'),
    render: (w, ctx) => box([
      '  ? Select toppings',
      '',
      '  [x] Cheese',
      '  [ ] Pepperoni',
      '  [x] Mushrooms',
      '  [ ] Olives',
      '',
      '  (space toggles, enter confirms)',
    ].join('\n'), { width: Math.min(40, w), ctx }),
  },
  {
    id: 'confirm',
    name: 'confirm()',
    subtitle: 'Yes/no confirmation',
    pkg: 'bijou',
    tier: 3,
    description: [
      '# confirm()',
      '',
      'Simple yes/no confirmation prompt with default value support.',
      '',
      '**Interactive component** — run standalone:',
      '',
      '```sh',
      'npx tsx examples/confirm/main.ts',
      '```',
    ].join('\n'),
    render: (w, ctx) => box([
      '  ? Continue with deployment? (Y/n)',
      '',
      '  (y/n or enter for default)',
    ].join('\n'), { width: Math.min(42, w), ctx }),
  },
  {
    id: 'input',
    name: 'input()',
    subtitle: 'Text input with validation',
    pkg: 'bijou',
    tier: 3,
    description: [
      '# input()',
      '',
      'Single-line text input with placeholder, validation, and required mode.',
      '',
      '**Interactive component** — run standalone:',
      '',
      '```sh',
      'npx tsx examples/input/main.ts',
      '```',
    ].join('\n'),
    render: (w, ctx) => box([
      '  ? Enter your name',
      '',
      '  > Alice_',
      '',
      '  (type and press enter)',
    ].join('\n'), { width: Math.min(40, w), ctx }),
  },
  {
    id: 'filter',
    name: 'filter()',
    subtitle: 'Fuzzy-filter select',
    pkg: 'bijou',
    tier: 3,
    description: [
      '# filter()',
      '',
      'Type-to-filter selection with fuzzy keyword matching.',
      'Supports vim-style normal/insert mode switching.',
      '',
      '**Interactive component** — run standalone:',
      '',
      '```sh',
      'npx tsx examples/filter/main.ts',
      '```',
    ].join('\n'),
    render: (w, ctx) => box([
      '  ? Search files',
      '  > src/comp_',
      '',
      '  > src/components/box.ts',
      '    src/components/badge.ts',
      '    src/components/alert.ts',
      '',
      '  3 matches',
    ].join('\n'), { width: Math.min(42, w), ctx }),
  },
  {
    id: 'textarea',
    name: 'textarea()',
    subtitle: 'Multi-line text input',
    pkg: 'bijou',
    tier: 3,
    description: [
      '# textarea()',
      '',
      'Multi-line text editor with cursor navigation, line numbers,',
      'and maxLength enforcement.',
      '',
      '**Interactive component** — run standalone:',
      '',
      '```sh',
      'npx tsx examples/textarea/main.ts',
      '```',
    ].join('\n'),
    render: (w, ctx) => box([
      '  ? Describe the issue',
      '',
      '  1 | The build fails when',
      '  2 | running on Node 22_',
      '  3 |',
      '',
      '  (ctrl+d to submit)',
    ].join('\n'), { width: Math.min(42, w), ctx }),
  },
  {
    id: 'wizard',
    name: 'wizard()',
    subtitle: 'Multi-step form orchestration',
    pkg: 'bijou',
    tier: 3,
    description: [
      '# wizard()',
      '',
      'Multi-step form with conditional skip logic, back navigation,',
      'and step progress display.',
      '',
      '**Interactive component** — run standalone:',
      '',
      '```sh',
      'npx tsx examples/wizard/main.ts',
      '```',
    ].join('\n'),
    render: (w, ctx) => box([
      '  Step 1 of 3: Account Setup',
      '',
      '  ? Enter username',
      '  > _',
      '',
      '  Next: Profile  |  Then: Review',
    ].join('\n'), { width: Math.min(42, w), ctx }),
  },
  {
    id: 'group',
    name: 'group()',
    subtitle: 'Multi-field form group',
    pkg: 'bijou',
    tier: 3,
    description: [
      '# group()',
      '',
      'Collects multiple form fields in sequence and returns all values.',
      '',
      '**Interactive component** — run standalone:',
      '',
      '```sh',
      'npx tsx examples/form-group/main.ts',
      '```',
    ].join('\n'),
    render: (w, ctx) => box([
      '  Form Group',
      '',
      '  name:    Alice',
      '  email:   alice@example.com',
      '  role:    Engineer',
      '',
      '  (fields collected sequentially)',
    ].join('\n'), { width: Math.min(42, w), ctx }),
  },
];

// ---------------------------------------------------------------------------
// TUI building blocks (TIER 2 — description + static preview)
// ---------------------------------------------------------------------------

const TUI: ComponentEntry[] = [
  {
    id: 'browsable-list',
    name: 'browsableList()',
    subtitle: 'Keyboard-navigable list',
    pkg: 'bijou-tui',
    tier: 2,
    description: [
      '# browsableList()',
      '',
      'Scrollable, keyboard-navigable list with focus tracking.',
      'State transformers for TEA composition. Vim-style keybindings.',
      '',
      '**Embeddable** — composable in any TEA app via state transformers.',
    ].join('\n'),
    render: (w, ctx) => box([
      '  > Item one',
      '    Item two',
      '    Item three',
      '    Item four',
      '    Item five',
    ].join('\n'), { width: Math.min(36, w), ctx }),
  },
  {
    id: 'navigable-table',
    name: 'navigableTable()',
    subtitle: 'Keyboard-navigable data table',
    pkg: 'bijou-tui',
    tier: 2,
    description: [
      '# navigableTable()',
      '',
      'Data table with row focus, keyboard navigation, page scrolling,',
      'and vim-style keybindings.',
      '',
      '**Embeddable** — composable in any TEA app.',
    ].join('\n'),
    render: (w, ctx) => table({
      columns: [
        { header: 'File', width: Math.min(16, Math.floor(w / 3)) },
        { header: 'Size', width: 8 },
        { header: 'Modified', width: 12 },
      ],
      rows: [
        ['> index.ts', '2.4 KB', '2 hours ago'],
        ['  app.ts', '8.1 KB', '1 day ago'],
        ['  utils.ts', '1.2 KB', '3 days ago'],
      ],
      ctx,
    }),
  },
  {
    id: 'pager',
    name: 'pager()',
    subtitle: 'Scrollable text viewer',
    pkg: 'bijou-tui',
    tier: 2,
    description: [
      '# pager()',
      '',
      'Full-page scrollable text viewer with status line showing position.',
      'Wraps `viewport()` with chrome.',
      '',
      '**Embeddable** — composable in any TEA app.',
    ].join('\n'),
    render: (w, ctx) => box([
      '  Line 1: Lorem ipsum dolor sit amet',
      '  Line 2: consectetur adipiscing elit',
      '  Line 3: sed do eiusmod tempor',
      '  --------- 3/100 lines ---------',
    ].join('\n'), { width: Math.min(44, w), ctx }),
  },
  {
    id: 'interactive-accordion',
    name: 'interactiveAccordion()',
    subtitle: 'Keyboard accordion',
    pkg: 'bijou-tui',
    tier: 2,
    description: [
      '# interactiveAccordion()',
      '',
      'Accordion sections with keyboard focus, expand/collapse, and',
      'expand-all/collapse-all actions.',
      '',
      '**Embeddable** — composable in any TEA app.',
    ].join('\n'),
    render: (_w, ctx) => accordion([
      { title: '> Getting Started', content: '  Install and configure bijou.', expanded: true },
      { title: '  API Reference', content: '', expanded: false },
      { title: '  Examples', content: '', expanded: false },
    ], { ctx }),
  },
  {
    id: 'dag-pane',
    name: 'dagPane()',
    subtitle: 'Interactive DAG viewer',
    pkg: 'bijou-tui',
    tier: 2,
    description: [
      '# dagPane()',
      '',
      '2D DAG viewer with node navigation (parent/child/sibling),',
      'scroll, and selection tracking. Wraps `dag()` + `focusArea()`.',
      '',
      '**Embeddable** — composable in any TEA app.',
    ].join('\n'),
    render: (w, ctx) => dag(SAMPLE_DAG, {
      selectedId: 'dev',
      maxWidth: Math.max(40, w),
      ctx,
    }),
  },
  {
    id: 'command-palette',
    name: 'commandPalette()',
    subtitle: 'Filterable action list',
    pkg: 'bijou-tui',
    tier: 2,
    description: [
      '# commandPalette()',
      '',
      'Searchable action list with live filtering. Type to filter,',
      'arrows to navigate, Enter to select.',
      '',
      '**Embeddable** — built into `createFramedApp` via ctrl+p.',
    ].join('\n'),
    render: (w, ctx) => box([
      '  > open fi_',
      '',
      '  > Open File         ctrl+o',
      '    Open Folder       ctrl+shift+o',
      '    Open Recent       ctrl+r',
    ].join('\n'), { width: Math.min(44, w), ctx }),
  },
  {
    id: 'canvas',
    name: 'canvas()',
    subtitle: 'Shader-based character grid',
    pkg: 'bijou-tui',
    tier: 2,
    description: [
      '# canvas()',
      '',
      'Character-grid renderer driven by a shader function.',
      '`(x, y, cols, rows, time?) => character`. Used for transitions,',
      'visual effects, and procedural patterns.',
      '',
      '**Embeddable** — runs on `tick()` for animation.',
    ].join('\n'),
    render: (w, ctx) => {
      const cols = Math.min(30, w - 4);
      const rows = 6;
      const lines: string[] = [];
      for (let y = 0; y < rows; y++) {
        let line = '';
        for (let x = 0; x < cols; x++) {
          const v = Math.sin(x * 0.3 + y * 0.5) * 0.5 + 0.5;
          line += v > 0.7 ? '#' : v > 0.4 ? '+' : v > 0.2 ? '.' : ' ';
        }
        lines.push(line);
      }
      return box(lines.join('\n'), { width: Math.min(cols + 4, w), ctx });
    },
  },
  {
    id: 'split-pane',
    name: 'splitPane()',
    subtitle: 'Resizable split layout',
    pkg: 'bijou-tui',
    tier: 2,
    description: [
      '# splitPane()',
      '',
      'Stateful split-pane layout (horizontal or vertical) with',
      'focus management, resize controls, and min-width/height constraints.',
      '',
      '**Embeddable** — composable in `createFramedApp` layouts.',
    ].join('\n'),
    render: (w, ctx) => {
      const hw = Math.min(18, Math.floor((w - 5) / 2));
      const left = box('Left pane', { width: hw, ctx });
      const right = box('Right pane', { width: hw, ctx });
      const lLines = left.split('\n');
      const rLines = right.split('\n');
      const maxH = Math.max(lLines.length, rLines.length);
      const lines: string[] = [];
      for (let i = 0; i < maxH; i++) {
        lines.push(`${lLines[i] ?? ''} | ${rLines[i] ?? ''}`);
      }
      return lines.join('\n');
    },
  },
  {
    id: 'modal',
    name: 'modal()',
    subtitle: 'Centered dialog overlay',
    pkg: 'bijou-tui',
    tier: 2,
    description: [
      '# modal()',
      '',
      'Centered overlay dialog with title, body, hint text,',
      'themed borders, and background token. Composited via `composite()`.',
      '',
      '**Embeddable** — used in `overlayFactory` of `createFramedApp`.',
    ].join('\n'),
    render: (w, ctx) => box([
      '         Confirm Action',
      '',
      '  Are you sure you want to proceed?',
      '',
      '     Enter = Yes   Esc = No',
    ].join('\n'), {
      width: Math.min(42, w),
      borderToken: ctx.border('primary'),
      ctx,
    }),
  },
  {
    id: 'toast',
    name: 'toast()',
    subtitle: 'Anchored notification overlay',
    pkg: 'bijou-tui',
    tier: 2,
    description: [
      '# toast()',
      '',
      'Corner-anchored notification with success/error/info variants.',
      'Auto-dismissing with configurable duration. 4-corner anchoring.',
      '',
      '**Embeddable** — used in `overlayFactory`.',
    ].join('\n'),
    render: (w, ctx) => [
      box('  Saved successfully!', { width: Math.min(30, w), borderToken: ctx.border('primary'), ctx }),
      box('  Error: connection lost', { width: Math.min(30, w), borderToken: ctx.border('warning'), ctx }),
    ].join('\n'),
  },
  {
    id: 'drawer',
    name: 'drawer()',
    subtitle: 'Slide-in side panel',
    pkg: 'bijou-tui',
    tier: 2,
    description: [
      '# drawer()',
      '',
      'Slide-in panel overlay anchored to left/right/top/bottom edges.',
      'Configurable width/height. Supports region-scoped attachment to',
      'individual panes.',
      '',
      '**Embeddable** — used in `overlayFactory`.',
    ].join('\n'),
    render: (w, ctx) => box([
      '  Drawer Panel',
      '',
      '  - Navigation item 1',
      '  - Navigation item 2',
      '  - Navigation item 3',
      '',
      '  o toggle  a anchor',
    ].join('\n'), { width: Math.min(30, w), borderToken: ctx.border('primary'), ctx }),
  },
  {
    id: 'status-bar',
    name: 'statusBar()',
    subtitle: 'Left/right justified status',
    pkg: 'bijou-tui',
    tier: 1,
    description: [
      '# statusBar()',
      '',
      'Single-line status bar with left, center, and right segments.',
      'Fill character customizable.',
    ].join('\n'),
    render: (_w, _ctx) => {
      // statusBar is imported from bijou-tui; use a simple mock render
      const w2 = 40;
      const left = ' NORMAL';
      const right = 'Ln 42, Col 8 ';
      const gap = w2 - left.length - right.length;
      return left + ' '.repeat(Math.max(1, gap)) + right;
    },
  },
];

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export interface Category {
  readonly id: string;
  readonly title: string;
  readonly entries: readonly ComponentEntry[];
}

export const CATEGORIES: readonly Category[] = [
  { id: 'display', title: 'Display', entries: DISPLAY },
  { id: 'data', title: 'Data', entries: DATA },
  { id: 'forms', title: 'Forms', entries: FORMS },
  { id: 'tui', title: 'TUI Blocks', entries: TUI },
];

/** Look up a component entry by ID across all categories. */
export function findEntry(id: string): ComponentEntry | undefined {
  for (const cat of CATEGORIES) {
    const found = cat.entries.find((e) => e.id === id);
    if (found) return found;
  }
  return undefined;
}
