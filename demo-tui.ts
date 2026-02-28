/**
 * 💎 Bijou High-Fidelity Showcase
 *
 * Demonstrates the full power of the Bijou TUI engine:
 * - Responsive Flexbox layout with auto-reflow
 * - Physics-based spring animations
 * - GSAP-style timeline orchestration
 * - Layered input handling (Modals/Overlays)
 * - Process telemetry & benchmarking
 *
 * Run: npx tsx demo-tui.ts
 */

import { initDefaultContext } from '@flyingrobots/bijou-node';
import {
  box,
  headerBox,
  badge,
  kbd,
  separator,
  table,
  tree,
  accordion,
  alert,
  timeline as staticTimeline,
  progressBar,
  spinnerFrame,
  PRESETS,
  setDefaultContext,
  getDefaultContext,
  createBijou,
} from '@flyingrobots/bijou';
import {
  run,
  quit,
  tick,
  animate,
  timeline,
  flex,
  viewport,
  vstack,
  hstack,
  createScrollState,
  scrollBy,
  createKeyMap,
  createInputStack,
  isKeyMsg,
  isResizeMsg,
  type App,
  type Cmd,
  type KeyMsg,
  type ResizeMsg,
} from '@flyingrobots/bijou-tui';

initDefaultContext();

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

const TABS = ['Dashboard', 'Components', 'Animation', 'Patterns', 'Layout'] as const;
type Tab = (typeof TABS)[number];

type Msg = 
  | { type: 'quit' }
  | { type: 'tick' }
  | { type: 'next-tab' }
  | { type: 'prev-tab' }
  | { type: 'cycle-theme' }
  | { type: 'scroll-up' }
  | { type: 'scroll-down' }
  | { type: 'toggle-turbo' }
  | { type: 'toggle-modal' }
  | { type: 'toggle-drawer' }
  | { type: 'animate-spring'; value: number }
  | { type: 'animate-tween'; value: number }
  | { type: 'spring-finished' }
  | { type: 'tween-finished' }
  | { type: 'animate-pulse'; scale: number }
  | { type: 'animate-drawer'; x: number; gen: number }
  | { type: 'reset-animations' };

// Build an orchestrated GSAP-style timeline
const showcaseTimeline = timeline()
  .add('box1', { from: 0, to: 100, spring: 'wobbly' })
  .add('box2', { from: 0, to: 100, spring: 'gentle' }, '+=200')
  .add('box3', { type: 'tween', from: 0, to: 100, duration: 1000 })
  .build();

interface Model {
  tab: number;
  cols: number;
  rows: number;
  themeIndex: number;
  turbo: boolean;
  
  // Overlays
  modalOpen: boolean;
  drawerOpen: boolean;
  drawerX: number;
  drawerGen: number; // Generation ID to prevent animation fighting
  
  // Telemetry
  cpuPercent: number;
  lastCpuUsage: { user: number; system: number };
  lastCpuTime: number;
  fps: number;
  lastFrameTime: number;
  memoryMb: number;
  
  // Animation state
  springVal: number;
  tweenVal: number;
  pulseScale: number;
  spinnerTick: number;
  
  // Direction for looping
  springDir: 1 | -1;
  tweenDir: 1 | -1;
  
  tlState: ReturnType<typeof showcaseTimeline.init>;
  scroll: ReturnType<typeof createScrollState>;
}

const THEME_NAMES = Object.keys(PRESETS);

// ---------------------------------------------------------------------------
// Input Handling
// ---------------------------------------------------------------------------

const keys = createKeyMap<Msg>()
  .bind('q', 'Quit', { type: 'quit' })
  .bind('ctrl+c', 'Force Quit', { type: 'quit' })
  .bind('tab', 'Next Tab', { type: 'next-tab' })
  .bind('shift+tab', 'Prev Tab', { type: 'prev-tab' })
  .bind('t', 'Cycle Theme', { type: 'cycle-theme' })
  .bind('f', 'Turbo Mode', { type: 'toggle-turbo' })
  .bind('m', 'Toggle Modal', { type: 'toggle-modal' })
  .bind('d', 'Toggle Drawer', { type: 'toggle-drawer' })
  .bind('r', 'Reset', { type: 'reset-animations' })
  .bind('up', 'Scroll Up', { type: 'scroll-up' })
  .bind('down', 'Scroll Down', { type: 'scroll-down' });

const modalKeys = createKeyMap<Msg>()
  .bind('escape', 'Close Modal', { type: 'toggle-modal' })
  .bind('enter', 'Close Modal', { type: 'toggle-modal' })
  .bind('q', 'Quit', { type: 'quit' });

const inputStack = createInputStack<KeyMsg, Msg>();
inputStack.push(keys);

// ---------------------------------------------------------------------------
// Animation Generators
// ---------------------------------------------------------------------------

function startSpring(model: Model): Cmd<Msg> {
  const to = model.springDir === 1 ? 100 : 0;
  const from = 100 - to;
  return animate({
    from,
    to,
    spring: { stiffness: 40, damping: 8 }, // slow & wobbly for visibility
    fps: model.turbo ? 500 : 60,
    onFrame: (v) => ({ type: 'animate-spring', value: v }),
    onComplete: () => ({ type: 'spring-finished' })
  });
}

function startTween(model: Model): Cmd<Msg> {
  const to = model.tweenDir === 1 ? 100 : 0;
  const from = 100 - to;
  return animate({
    type: 'tween',
    from,
    to,
    duration: 2000,
    onFrame: (v) => ({ type: 'animate-tween', value: v }),
    onComplete: () => ({ type: 'tween-finished' })
  });
}

// ---------------------------------------------------------------------------
// App Logic
// ---------------------------------------------------------------------------

const app: App<Model, Msg | ResizeMsg> = {
  init: () => {
    const ctx = getDefaultContext();
    const now = Date.now();
    const initialModel: Model = {
      tab: 0,
      cols: ctx.runtime.columns,
      rows: ctx.runtime.rows,
      themeIndex: 0,
      turbo: false,
      modalOpen: false,
      drawerOpen: false,
      drawerX: 0,
      drawerGen: 0,
      cpuPercent: 0,
      lastCpuUsage: process.cpuUsage(), // Demo-only: bypasses ports for telemetry
      lastCpuTime: now,
      fps: 0,
      lastFrameTime: now,
      memoryMb: 0,
      springVal: 0,
      tweenVal: 0,
      pulseScale: 1,
      spinnerTick: 0,
      springDir: 1,
      tweenDir: 1,
      tlState: showcaseTimeline.init(),
      scroll: createScrollState('', 10),
    };

    return [
      initialModel,
      [
        tick(16, { type: 'tick' }),
        startSpring(initialModel),
        startTween(initialModel),
      ],
    ];
  },

  update: (msg, model) => {
    // Resize
    if (isResizeMsg(msg)) {
      return [{ ...model, cols: msg.columns, rows: msg.rows }, []];
    }

    // Heartbeat & Telemetry
    if ('type' in msg && msg.type === 'tick') {
      // Animate on Dashboard/Animation tabs, or while drawer is spring-animating
      const isAnimTab = TABS[model.tab] === 'Animation' || TABS[model.tab] === 'Dashboard' || model.drawerOpen;
      const now = Date.now();
      const nextTl = isAnimTab ? showcaseTimeline.step(model.tlState, 0.016) : model.tlState;
      
      const usage = process.cpuUsage();
      const dtUs = (now - model.lastCpuTime) * 1000;
      const cpuPercent = dtUs > 0 
        ? ((usage.user - model.lastCpuUsage.user + usage.system - model.lastCpuUsage.system) / dtUs) * 100 
        : 0;
      
      const fps = now - model.lastFrameTime > 0 
        ? 1000 / (now - model.lastFrameTime) 
        : 0;

      return [
        { 
          ...model, 
          spinnerTick: isAnimTab ? model.spinnerTick + 1 : model.spinnerTick, 
          tlState: nextTl, 
          cpuPercent, 
          lastCpuUsage: usage, 
          lastCpuTime: now, 
          fps, 
          lastFrameTime: now, 
          memoryMb: process.memoryUsage().rss / 1024 / 1024 
        },
        [tick(model.turbo ? 0 : 16, { type: 'tick' })]
      ];
    }

    // Physics Callbacks
    if ('type' in msg && msg.type === 'animate-spring') return [{ ...model, springVal: msg.value }, []];
    if ('type' in msg && msg.type === 'animate-tween') return [{ ...model, tweenVal: msg.value }, []];
    if ('type' in msg && msg.type === 'spring-finished') {
      const nextModel = { ...model, springDir: (model.springDir === 1 ? -1 : 1) as (1 | -1) };
      return [nextModel, [startSpring(nextModel)]];
    }
    if ('type' in msg && msg.type === 'tween-finished') {
      const nextModel = { ...model, tweenDir: (model.tweenDir === 1 ? -1 : 1) as (1 | -1) };
      return [nextModel, [startTween(nextModel)]];
    }

    // Pattern Callbacks
    if ('type' in msg && msg.type === 'animate-drawer') {
      if (msg.gen !== model.drawerGen) return [model, []];
      return [{ ...model, drawerX: msg.x }, []];
    }
    if ('type' in msg && msg.type === 'animate-pulse') return [{ ...model, pulseScale: msg.scale }, []];

    // Input Dispatch
    let action: Msg | undefined;
    if (isKeyMsg(msg)) {
      action = inputStack.dispatch(msg);
    } else {
      action = msg as Msg;
    }

    if (!action) return [model, []];

    switch (action.type) {
      case 'quit': return [model, [quit()]];
      
      case 'toggle-turbo': return [{ ...model, turbo: !model.turbo }, []];
      
      case 'toggle-modal':
        if (!model.modalOpen) inputStack.push(modalKeys); else inputStack.pop();
        return [{ ...model, modalOpen: !model.modalOpen }, []];
      
      case 'toggle-drawer': {
        const nextDrawer = !model.drawerOpen;
        const nextGen = model.drawerGen + 1;
        return [
          { ...model, drawerOpen: nextDrawer, drawerGen: nextGen }, 
          [animate({ 
            from: model.drawerX, 
            to: nextDrawer ? 30 : 0, 
            spring: 'gentle', 
            onFrame: (x) => ({ type: 'animate-drawer', x, gen: nextGen }) 
          })]
        ];
      }

      case 'reset-animations': {
        const resetModel: Model = { ...model, tlState: showcaseTimeline.init(), springVal: 0, tweenVal: 0, springDir: 1, tweenDir: 1 };
        return [resetModel, [startSpring(resetModel), startTween(resetModel)]];
      }

      case 'next-tab':
      case 'prev-tab': {
        const nextTab = action.type === 'next-tab' ? (model.tab + 1) % TABS.length : (model.tab - 1 + TABS.length) % TABS.length;
        return [
          { ...model, tab: nextTab }, 
          [animate({ from: 0.8, to: 1, spring: 'wobbly', onFrame: (s) => ({ type: 'animate-pulse', scale: s }) })]
        ];
      }

      case 'cycle-theme': {
        const nextIndex = (model.themeIndex + 1) % THEME_NAMES.length;
        const current = getDefaultContext();
        setDefaultContext(createBijou({ 
          runtime: current.runtime, 
          io: current.io, 
          style: current.style, 
          theme: PRESETS[THEME_NAMES[nextIndex]!] 
        }));
        return [{ ...model, themeIndex: nextIndex }, []];
      }

      case 'scroll-up': return [{ ...model, scroll: scrollBy(model.scroll, -1) }, []];
      case 'scroll-down': return [{ ...model, scroll: scrollBy(model.scroll, 1) }, []];
    }

    return [model, []];
  },

  view: (model) => {
    // 1. Build the Main Application View
    const mainView = flex(
      { direction: 'row', width: model.cols, height: model.rows },
      { basis: 24, content: (w, h) => renderSidebar(model, w, h) },
      { basis: 1, content: (_w, h) => '│\n'.repeat(h).trimEnd() },
      { flex: 1, content: (w, h) => renderMainContent(model, w, h) },
      { 
        basis: Math.round(model.drawerX), 
        content: (w, h) => (w > 0 ? renderDrawer(model, w, h) : '') 
      }
    );

    // 2. If Modal is open, layer it on top
    if (model.modalOpen) {
      return flex(
        { direction: 'column', width: model.cols, height: model.rows },
        { 
          flex: 1, 
          align: 'center', 
          content: (w, h) => 
            // Nest horizontal flex to get dead-center
            flex(
              { direction: 'row', width: w, height: h },
              { flex: 1, align: 'center', content: renderModal(model) }
            )
        }
      );
    }

    return mainView;
  }
};

// ---------------------------------------------------------------------------
// Component Renders
// ---------------------------------------------------------------------------

function renderSidebar(model: Model, w: number, h: number): string {
  const nav = TABS.map((t, i) => {
    const isSelected = i === model.tab;
    const indicator = isSelected ? ' ➜ ' : '   ';
    const text = isSelected ? badge(t, { variant: 'info' }) : t;
    return `${indicator}${text}`;
  }).join('\n\n');

  const controls = vstack(
    separator({ width: w }),
    `  Theme: ${badge(THEME_NAMES[model.themeIndex]!, { variant: 'accent' })}`,
    `  Engine: ${model.turbo ? badge(' TURBO ', { variant: 'error' }) : badge(' NORMAL ', { variant: 'success' })}`,
    '',
    `  ${kbd('tab')} Cycle`,
    `  ${kbd('m')}   Modal`,
    `  ${kbd('d')}   Drawer`,
    `  ${kbd('f')}   Turbo`,
    `  ${kbd('q')}   Quit`
  );

  return flex(
    { direction: 'column', width: w, height: h },
    { basis: 3, content: headerBox('BIJOU', { width: w }) },
    { basis: 1, content: '' },
    { flex: 1, content: nav },
    { basis: 12, content: controls }
  );
}

function renderDrawer(model: Model, w: number, h: number): string {
  const content = vstack(
    headerBox('DRAWER', { width: w - 1 }),
    '',
    '  This side panel',
    '  is driven by a',
    '  physics spring.',
    '',
    '  Resizes dynamically',
    '  with the terminal.',
    '',
    separator({ width: w - 1 }),
    `  ${kbd('d')} to close`
  );

  return flex(
    { direction: 'row', width: w, height: h },
    { basis: 1, content: (_w, h) => '│\n'.repeat(h).trimEnd() },
    { flex: 1, content: content }
  );
}

function renderModal(model: Model): string {
  const content = vstack(
    ' 🎭 MODAL OVERLAY ',
    '',
    'This modal captures all input.',
    'Global shortcuts are disabled.',
    '',
    'Powered by Layered InputStack.',
    '',
    `Press ${kbd('Esc')} or ${kbd('Enter')} to close.`
  );

  const theme = PRESETS[THEME_NAMES[model.themeIndex]!]!;
  return box(content, { borderToken: theme.semantic.accent });
}

function renderMainContent(model: Model, w: number, h: number): string {
  const tab = TABS[model.tab]!;
  const tlVals = showcaseTimeline.values(model.tlState);
  let body = '';

  switch (tab) {
    case 'Dashboard': {
      const stats = hstack(
        2,
        box(` CPU: ${model.cpuPercent.toFixed(1).padStart(4, ' ')}% `, { variant: 'success' }),
        box(` MEM: ${model.memoryMb.toFixed(1).padStart(4, ' ')}MB `, { variant: 'info' }),
        box(` FPS: ${model.fps.toFixed(0).padStart(3, ' ')} `, { variant: 'accent' })
      );

      body = vstack(
        headerBox('Process Telemetry', { detail: model.turbo ? 'UNCAPPED' : '60 FPS', width: w - 4 }),
        stats,
        '',
        'Engine Status:',
        `  ${spinnerFrame(model.spinnerTick, { label: 'Bijou Kernel active...' })}`,
        '',
        'Recent Activity:',
        staticTimeline([
          { label: 'System Boot', status: 'success' },
          { label: 'Adapters initialized', status: 'success' },
          { label: 'Physics engine ready', status: 'active' }
        ])
      );
    } break;
      
    case 'Components':
      body = vstack(
        'Rich data components:',
        hstack(
          4,
          vstack('TREES', tree([{ label: 'bijou', children: [{ label: 'core' }, { label: 'tui' }] }])),
          vstack('ACCORDIONS', accordion([{ title: 'Info', content: 'Details here', expanded: true }]))
        ),
        '',
        'Standard UI elements:',
        hstack(
          4,
          vstack('BADGES', badge('success', { variant: 'success' }), badge('error', { variant: 'error' })),
          vstack('ALERTS', alert('All systems go', { variant: 'info' })),
          vstack('INPUTS', kbd('Enter'), kbd('Ctrl+C'))
        ),
        '',
        table({
          columns: [{ header: 'Prop' }, { header: 'Type' }, { header: 'Default' }],
          rows: [['flex', 'number', '0'], ['basis', 'number', 'auto'], ['min', 'number', '0']]
        })
      );
      break;

    case 'Animation':
      body = vstack(
        'Physics-based springs & easing:',
        '',
        'Spring (Slow Wobbly):',
        progressBar(model.springVal, { width: w - 10 }),
        '',
        'Tween (2s Linear):',
        progressBar(model.tweenVal, { width: w - 10 }),
        '',
        'GSAP Timeline Orchestration:',
        ` Track 1: ${progressBar(tlVals.box1 ?? 0, { width: 20 })}`,
        ` Track 2: ${progressBar(tlVals.box2 ?? 0, { width: 20 })}`,
        ` Track 3: ${progressBar(tlVals.box3 ?? 0, { width: 20 })}`
      );
      break;

    case 'Patterns':
      body = vstack(
        'High-level UI patterns:',
        '',
        `  ${kbd('m')}  Open Modal Overlay`,
        `  ${kbd('d')}  Toggle Slide-out Drawer`,
        '',
        'These are not "hardcoded" widgets. They are',
        'composed using Flexbox, Springs, and the',
        'InputStack engine.',
        '',
        headerBox('Input Stack State', { width: w - 4 }),
        `  Layers active: ${inputStack.size}`,
        `  Top layer: ${model.modalOpen ? 'ModalKeys' : 'GlobalKeys'}`
      );
      break;

    case 'Layout':
      body = flex(
        { direction: 'column', width: w, height: h, gap: 1 },
        { basis: 1, content: 'The Layout Engine understands constraints:' },
        { basis: 1, content: '' },
        { basis: 3, content: box('Header (Fixed 3 rows)') },
        { flex: 1, align: 'center', content: box('Body (Flexible - center aligned)') },
        { basis: 3, content: box('Footer (Fixed 3 rows)') }
      );
      break;
  }

  return viewport({
    width: w,
    height: h,
    content: body,
    scrollY: model.scroll.y,
  });
}

run(app);
