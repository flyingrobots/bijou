/**
 * bijou component catalog — interactive TUI demo
 *
 * Run: npx tsc -p packages/bijou-tui/tsconfig.json && npx tsx demo-tui.ts
 */

import { initDefaultContext } from '@flyingrobots/bijou-node';
import {
  box,
  headerBox,
  badge,
  kbd,
  separator,
  alert,
  skeleton,
  table,
  tree,
  accordion,
  timeline,
  progressBar,
  spinnerFrame,
  tabs,
  breadcrumb,
  paginator,
  stepper,
} from '@flyingrobots/bijou';
import { run, quit, tick, vstack, hstack, type App, type KeyMsg, type Cmd } from '@flyingrobots/bijou-tui';

initDefaultContext();

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

const TABS = ['Elements', 'Data', 'Live', 'Layout', 'Navigation'] as const;
type Tab = (typeof TABS)[number];

interface Model {
  tab: number;
  spinnerTick: number;
  progress: number;
  progressDir: 1 | -1;
  accordionOpen: boolean[];
  scrollY: number;
}

type Msg = { type: 'tick' };

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const app: App<Model, Msg> = {
  init() {
    return [
      {
        tab: 0,
        spinnerTick: 0,
        progress: 0,
        progressDir: 1,
        accordionOpen: [true, false, false],
        scrollY: 0,
      },
      [tick(80, { type: 'tick' })],
    ];
  },

  update(msg, model) {
    // Tick — advance spinner + progress
    if ('type' in msg && msg.type === 'tick') {
      let progress = model.progress + model.progressDir * 2;
      let dir = model.progressDir;
      if (progress >= 100) { progress = 100; dir = -1; }
      if (progress <= 0) { progress = 0; dir = 1; }
      return [
        { ...model, spinnerTick: model.spinnerTick + 1, progress, progressDir: dir },
        [tick(80, { type: 'tick' })],
      ];
    }

    // Key messages
    const key = msg as KeyMsg;

    if (key.key === 'q' || (key.key === 'c' && key.ctrl)) {
      return [model, [quit<Msg>()]];
    }

    // Tab navigation
    if (key.key === 'tab' && !key.shift) {
      return [{ ...model, tab: (model.tab + 1) % TABS.length, scrollY: 0 }, []];
    }
    if ((key.key === 'tab' && key.shift) || key.key === 'left') {
      return [{ ...model, tab: (model.tab - 1 + TABS.length) % TABS.length, scrollY: 0 }, []];
    }
    if (key.key === 'right') {
      return [{ ...model, tab: (model.tab + 1) % TABS.length, scrollY: 0 }, []];
    }

    // Scroll
    if (key.key === 'up') {
      return [{ ...model, scrollY: Math.max(0, model.scrollY - 1) }, []];
    }
    if (key.key === 'down') {
      return [{ ...model, scrollY: model.scrollY + 1 }, []];
    }

    // Toggle accordion (1/2/3 keys)
    if (key.key === '1' || key.key === '2' || key.key === '3') {
      const idx = parseInt(key.key) - 1;
      const open = [...model.accordionOpen];
      open[idx] = !open[idx];
      return [{ ...model, accordionOpen: open }, []];
    }

    return [model, []];
  },

  view(model) {
    const currentTab = TABS[model.tab]!;

    // Tab bar
    const tabBar = TABS.map((t, i) =>
      i === model.tab ? badge(` ${t} `, { variant: 'info' }) : ` ${t} `,
    ).join('  ');

    // Content
    let content: string;
    switch (currentTab) {
      case 'Elements':
        content = viewElements();
        break;
      case 'Data':
        content = viewData(model);
        break;
      case 'Live':
        content = viewLive(model);
        break;
      case 'Layout':
        content = viewLayout();
        break;
      case 'Navigation':
        content = viewNavigation();
        break;
    }

    // Apply scroll
    const lines = content.split('\n');
    const scrolled = lines.slice(model.scrollY).join('\n');

    // Help bar
    const help = separator({ width: 60 }) + '\n' +
      `  ${kbd('←')} ${kbd('→')} tabs   ${kbd('↑')} ${kbd('↓')} scroll   ` +
      `${kbd('q')} quit`;

    return vstack(
      `  ${tabBar}`,
      separator({ width: 60 }),
      scrolled,
      help,
    );
  },
};

// ---------------------------------------------------------------------------
// Tab views
// ---------------------------------------------------------------------------

function viewElements(): string {
  const badges = '  ' + ['success', 'error', 'warning', 'info', 'muted']
    .map((v) => badge(v, { variant: v as 'success' | 'error' | 'warning' | 'info' | 'muted' }))
    .join('  ');

  const kbds = `  ${kbd('⌘')} + ${kbd('Shift')} + ${kbd('P')}  Command Palette`;

  const alerts = vstack(
    alert('Operation completed successfully!', { variant: 'success' }),
    alert('Something went wrong.', { variant: 'error' }),
    alert('Proceed with caution.', { variant: 'warning' }),
    alert('Here is some useful info.', { variant: 'info' }),
  );

  const skel = skeleton({ width: 30, lines: 3 });

  return vstack(
    '',
    '  BADGES',
    badges,
    '',
    '  KEYBOARD SHORTCUTS',
    kbds,
    '',
    '  ALERTS',
    alerts,
    '',
    '  SKELETON',
    skel,
    '',
  );
}

function viewData(model: Model): string {
  const tbl = table({
    columns: [
      { header: 'Component' },
      { header: 'Type' },
      { header: 'Status' },
    ],
    rows: [
      ['box', 'Display', 'Stable'],
      ['badge', 'Element', 'Stable'],
      ['tree', 'Data', 'Stable'],
      ['accordion', 'Data', 'Stable'],
      ['timeline', 'Data', 'Stable'],
    ],
  });

  const tr = tree([
    {
      label: 'bijou',
      children: [
        { label: 'core', children: [
          { label: 'components' },
          { label: 'forms' },
          { label: 'theme' },
        ]},
        { label: 'bijou-node' },
        { label: 'bijou-tui', children: [
          { label: 'runtime' },
          { label: 'keys' },
          { label: 'layout' },
        ]},
      ],
    },
  ]);

  const sections = [
    { title: 'Architecture', content: 'Hexagonal architecture with ports & adapters.\nAll I/O abstracted behind RuntimePort, IOPort, StylePort.', expanded: model.accordionOpen[0] },
    { title: 'Theme Engine', content: 'Triple-generic Theme<S, U, G> with DTCG interop.\nTwo presets: cyan-magenta, teal-orange-pink.', expanded: model.accordionOpen[1] },
    { title: 'TEA Runtime', content: 'Model/Update/View cycle with explicit side effects.\nKeyboard input, alt screen, graceful degradation.', expanded: model.accordionOpen[2] },
  ];

  const tl = timeline([
    { label: 'Project started', status: 'success' },
    { label: 'v0.1.0 released', description: 'Hexagonal architecture', status: 'success' },
    { label: 'Components added', description: 'tree, accordion, timeline, badge, alert...', status: 'success' },
    { label: 'bijou-tui', description: 'TEA runtime for terminal UIs', status: 'active' },
    { label: 'Navigation components', description: 'tabs, breadcrumb, paginator', status: 'muted' },
    { label: 'Overlay patterns', description: 'modal, toast, drawer', status: 'muted' },
  ]);

  return vstack(
    '',
    '  TABLE',
    tbl,
    '',
    '  TREE',
    tr,
    '',
    `  ACCORDION  (press ${kbd('1')} ${kbd('2')} ${kbd('3')} to toggle)`,
    accordion(sections),
    '',
    '  TIMELINE',
    tl,
    '',
  );
}

function viewLive(model: Model): string {
  const spinner = spinnerFrame(model.spinnerTick, { label: 'Loading...' });

  const bar25 = progressBar(25, { width: 30 });
  const bar50 = progressBar(50, { width: 30 });
  const bar75 = progressBar(75, { width: 30 });
  const bar100 = progressBar(100, { width: 30 });
  const barLive = progressBar(model.progress, { width: 30 });

  return vstack(
    '',
    '  SPINNER (animated)',
    `  ${spinner}`,
    '',
    '  PROGRESS BAR (static)',
    `  25%   ${bar25}`,
    `  50%   ${bar50}`,
    `  75%   ${bar75}`,
    `  100%  ${bar100}`,
    '',
    '  PROGRESS BAR (animated)',
    `  ${barLive}`,
    '',
    '  BOX',
    box('Hello from bijou!\nPure-render terminal components.'),
    '',
    '  HEADER BOX',
    headerBox('bijou-tui', { detail: 'v0.1.0' }),
    '',
  );
}

function viewLayout(): string {
  const a = box('Block A');
  const b = box('Block B');
  const c = box('Block C');

  return vstack(
    '',
    '  VSTACK — vertical composition',
    vstack(a, b),
    '',
    '  HSTACK — horizontal composition (gap=2)',
    hstack(2, a, b, c),
    '',
    '  NESTED — hstack inside vstack',
    vstack(
      hstack(1, box('Left'), box('Right')),
      box('Full Width Below'),
    ),
    '',
  );
}

function viewNavigation(): string {
  const tabBar = tabs(
    [
      { label: 'Dashboard' },
      { label: 'Settings' },
      { label: 'Users', badge: '3' },
    ],
    { active: 0 },
  );

  const bc = breadcrumb(['Home', 'Settings', 'Profile']);

  const dots = paginator({ current: 1, total: 4 });
  const textPager = paginator({ current: 1, total: 4, style: 'text' });

  const steps = stepper(
    [
      { label: 'Account' },
      { label: 'Payment' },
      { label: 'Confirm' },
    ],
    { current: 1 },
  );

  return vstack(
    '',
    '  TABS',
    `  ${tabBar}`,
    '',
    '  BREADCRUMB',
    `  ${bc}`,
    '',
    '  PAGINATOR (dots)',
    `  ${dots}`,
    '',
    '  PAGINATOR (text)',
    `  ${textPager}`,
    '',
    '  STEPPER',
    `  ${steps}`,
    '',
  );
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

run(app);
