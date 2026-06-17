import type { BijouContext, DagNode, TreeNode, TimelineEvent } from '@flyingrobots/bijou';
import {
  alert,
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
} from '@flyingrobots/bijou';
import { SAMPLE_DAG, SAMPLE_TIMELINE, SAMPLE_TREE } from './registry-samples.js';

export const TUI: ComponentEntry[] = [
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
      'Single-line status rail with left, center, and right segments.',
      'Use `statusBarSurface()` when shell chrome stays on the structured surface path.',
    ].join('\n'),
    render: () => statusBarSurface({
      left: ' NORMAL',
      center: 'TypeScript',
      right: 'Ln 42, Col 8 ',
      width: 40,
    }),
  },
];

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
