import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { boxSurface, type BijouContext, kbd } from '@flyingrobots/bijou';
import {
  run,
  createKeyMap,
  createFramedApp,
  createSplitPaneState,
  inspectorDrawer,
  type FramePage,
} from '@flyingrobots/bijou-tui';

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

const globalKeys = createKeyMap<Msg>()
  .bind('o', 'Toggle inspector drawer', { type: 'toggle-inspector' });

export function createAppFrameDemo(ctx: BijouContext = initDefaultContext()) {
  const editorPage = createPage('editor', 'Editor', (model) => ({
    kind: 'split',
    splitId: 'editor-shell',
    state: model.editorSplit,
    paneA: {
      kind: 'pane',
      paneId: 'files',
      render: (width) => boxSurface(`Files\n\n- src/app.ts\n- src/frame.ts\n- test/app.test.ts\n\n${width} cols`, {
        width,
        ctx,
      }),
    },
    paneB: {
      kind: 'pane',
      paneId: 'content',
      overflowX: 'scroll',
      render: (width, height) => boxSurface(`Editor\n\ncount = ${model.count}\n\nfunction main() {\n  return 'v1.3 app frame';\n}\n\n${width}x${height}`, {
        width,
        ctx,
      }),
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
        render: (width) => boxSurface(`Stats: counter=${model.count}`, { width, ctx }),
      },
      left: {
        kind: 'pane',
        paneId: 'left',
        render: (width) => boxSurface('Queues\n\n- build\n- test\n- release', { width, ctx }),
      },
      right: {
        kind: 'pane',
        paneId: 'right',
        render: (width) => boxSurface('Signals\n\n- latency\n- errors\n- throughput', { width, ctx }),
      },
    },
  }));

  return createFramedApp<PageModel, Msg>({
    title: 'Bijou App Frame Demo',
    pages: [editorPage, dashboardPage],
    globalKeys,
    enableCommandPalette: true,
    transition: 'melt',
    transitionDuration: 600,
    overlayFactory(frame) {
      if (!frame.pageModel.inspector) return [];

      const firstPane = frame.paneRects.values().next().value;
      if (!firstPane) return [];

      return [inspectorDrawer({
        anchor: 'right',
        width: Math.max(22, Math.floor(firstPane.width * 0.45)),
        region: firstPane,
        screenWidth: frame.screenRect.width,
        screenHeight: frame.screenRect.height,
        title: 'Inspector',
        inspector: {
          title: 'Focused context',
          currentValue: frame.activePageId,
          currentValueLabel: 'Current selection',
          sections: [
            { title: 'Page', content: frame.activePageId },
            { title: 'Focus', content: 'Shell-attached inspector drawer', tone: 'muted' },
            {
              title: 'Palette',
              content: `Use ${kbd('tab', { ctx })} to change focused pane.\nUse ${kbd('ctrl+p', { ctx })} for palette.`,
              tone: 'muted',
            },
          ],
        },
        borderToken: ctx.border('primary'),
        bgToken: ctx.surface('elevated'),
        ctx,
      })];
    },
  });
}

export async function main(ctx: BijouContext = initDefaultContext()): Promise<void> {
  await run(createAppFrameDemo(ctx));
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(console.error);
}
