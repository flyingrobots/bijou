import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, kbd } from '@flyingrobots/bijou';
import {
  run,
  createKeyMap,
  createFramedApp,
  createSplitPaneState,
  drawer,
  type FramePage,
} from '@flyingrobots/bijou-tui';

const ctx = initDefaultContext();

type Msg =
  | { type: 'inc' }
  | { type: 'toggle-inspector' };

interface PageModel {
  count: number;
  inspector: boolean;
  editorSplit: ReturnType<typeof createSplitPaneState>;
}

function createInitialPageModel(): PageModel {
  return {
    count: 0,
    inspector: false,
    editorSplit: createSplitPaneState({ ratio: 0.38 }),
  };
}

function updatePageModel(msg: Msg, model: PageModel): [PageModel, []] {
  if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
  if (msg.type === 'toggle-inspector') return [{ ...model, inspector: !model.inspector }, []];
  return [model, []];
}

function createPageKeyMap() {
  return createKeyMap<Msg>().bind('x', 'Increment counter', { type: 'inc' });
}

function createPage(
  id: string,
  title: string,
  layout: FramePage<PageModel, Msg>['layout'],
): FramePage<PageModel, Msg> {
  return {
    id,
    title,
    init: () => [createInitialPageModel(), []],
    update: updatePageModel,
    keyMap: createPageKeyMap(),
    layout,
  };
}

const editorPage = createPage('editor', 'Editor', (model) => ({
  kind: 'split',
  splitId: 'editor-shell',
  state: model.editorSplit,
  paneA: {
    kind: 'pane',
    paneId: 'files',
    render: (w) => box(`Files\n\n- src/app.ts\n- src/frame.ts\n- test/app.test.ts\n\n${w} cols`, { width: w }),
  },
  paneB: {
    kind: 'pane',
    paneId: 'content',
    overflowX: 'scroll',
    render: (w, h) => box(`Editor\n\ncount = ${model.count}\n\nfunction main() {\n  return 'v1.3 app frame';\n}\n\n${w}x${h}`, { width: w }),
  },
}));

const dashboardPage = createPage('dashboard', 'Dashboard', (model) => ({
  kind: 'grid',
  gridId: 'dash-grid',
  columns: ['1fr', '1fr'],
  rows: [3, '1fr'],
  areas: [
    'stats stats',
    'left right',
  ],
  gap: 1,
  cells: {
    stats: {
      kind: 'pane',
      paneId: 'stats',
      render: (w) => box(`Stats: counter=${model.count}`, { width: w }),
    },
    left: {
      kind: 'pane',
      paneId: 'left',
      render: (w) => box('Queues\n\n- build\n- test\n- release', { width: w }),
    },
    right: {
      kind: 'pane',
      paneId: 'right',
      render: (w) => box('Signals\n\n- latency\n- errors\n- throughput', { width: w }),
    },
  },
}));

const globalKeys = createKeyMap<Msg>()
  .bind('o', 'Toggle inspector drawer', { type: 'toggle-inspector' });

const app = createFramedApp<PageModel, Msg>({
  title: 'Bijou App Frame Demo',
  pages: [editorPage, dashboardPage],
  globalKeys,
  enableCommandPalette: true,
  overlayFactory(frame) {
    if (!frame.pageModel.inspector) return [];

    const firstPane = frame.paneRects.values().next().value;
    if (!firstPane) return [];

    return [drawer({
      anchor: 'right',
      width: Math.max(22, Math.floor(firstPane.width * 0.45)),
      region: firstPane,
      screenWidth: frame.screenRect.width,
      screenHeight: frame.screenRect.height,
      title: 'Inspector',
      content: `Active page: ${frame.activePageId}\n\nUse ${kbd('tab')} to change focused pane.\nUse ${kbd('ctrl+p')} for palette.`,
      borderToken: ctx.theme.theme.border.primary,
      bgToken: ctx.theme.theme.surface.elevated,
      ctx,
    })];
  },
});

run(app);
