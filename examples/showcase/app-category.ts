import type { BijouContext } from '@flyingrobots/bijou';
import { animate, createBrowsableListState, createKeyMap, createSplitPaneState, listFocusNext, listFocusPrev, listPageDown, listPageUp, quit, type FrameLayoutNode, type FramePage } from '@flyingrobots/bijou-tui';
import type { ShowcaseMsg, ShowcasePageModel } from './types.js';
import type { Category } from './registry.js';
import { contentSurface } from '../_shared/example-surfaces.ts';
import { renderDetail, renderSidebar } from './app-views.js';
import { clamp01 } from './app-utils.js';

export function createCategoryPage(
  category: Category,
  isFirstPage: boolean,
  ctx: BijouContext,
): FramePage<ShowcasePageModel, ShowcaseMsg> {
  const items = category.entries.map((e) => ({
    label: e.name,
    value: e.id,
    description: e.subtitle,
  }));

  return {
    id: category.id,
    title: category.title,

    init() {
      const listState = createBrowsableListState({ items, height: 40 });
      const gen = 1;
      const model: ShowcasePageModel = {
        listState,
        quitConfirmOpen: false,
        drawerOpen: isFirstPage,
        drawerProgress: 0,
        drawerAnimGen: gen,
      };
      const cmds: ReturnType<typeof animate<ShowcaseMsg>>[] = [];
      if (isFirstPage) {
        cmds.push(animate<ShowcaseMsg>({
          from: 0,
          to: 1,
          spring: 'default',
          onFrame: (value) => ({ type: 'drawer-progress', value, gen }),
        }));
      }
      return [model, cmds];
    },

    update(msg, model) {
      if (msg.type === 'force-quit') {
        return [model, [quit()]];
      }

      if (model.quitConfirmOpen) {
        if (msg.type === 'confirm-quit') return [model, [quit()]];
        if (msg.type === 'cancel-quit') return [{ ...model, quitConfirmOpen: false }, []];
        return [model, []];
      }

      switch (msg.type) {
        case 'nav-next':
          return [{ ...model, listState: listFocusNext(model.listState) }, []];
        case 'nav-prev':
          return [{ ...model, listState: listFocusPrev(model.listState) }, []];
        case 'nav-page-down':
          return [{ ...model, listState: listPageDown(model.listState) }, []];
        case 'nav-page-up':
          return [{ ...model, listState: listPageUp(model.listState) }, []];
        case 'request-quit':
          return [{ ...model, quitConfirmOpen: true }, []];
        case 'cancel-quit':
          if (model.drawerOpen) {
            const nextGen = model.drawerAnimGen + 1;
            return [{ ...model, drawerOpen: false, drawerAnimGen: nextGen }, [
              animate<ShowcaseMsg>({
                from: model.drawerProgress,
                to: 0,
                spring: 'default',
                onFrame: (value) => ({ type: 'drawer-progress', value, gen: nextGen }),
              }),
            ]];
          }
          return [model, []];
        case 'confirm-quit':
          return [model, []];
        case 'toggle-drawer': {
          const drawerOpen = !model.drawerOpen;
          const target = drawerOpen ? 1 : 0;
          const nextGen = model.drawerAnimGen + 1;
          return [{ ...model, drawerOpen, drawerAnimGen: nextGen }, [
            animate<ShowcaseMsg>({
              from: model.drawerProgress,
              to: target,
              spring: 'default',
              onFrame: (value) => ({ type: 'drawer-progress', value, gen: nextGen }),
            }),
          ]];
        }
        case 'drawer-progress':
          // Ignore stale frames from superseded animations
          if (msg.gen !== model.drawerAnimGen) return [model, []];
          return [{ ...model, drawerProgress: clamp01(msg.value) }, []];
        case 'force-quit':
          return [model, [quit()]];
        case 'mouse':
        case 'pulse':
          return [model, []];
      }
    },

    keyMap: createKeyMap<ShowcaseMsg>()
      .group('Sidebar', (g) => g
        .bind('down', 'Next component', { type: 'nav-next' })
        .bind('up', 'Previous component', { type: 'nav-prev' })
        .bind('pagedown', 'Page down', { type: 'nav-page-down' })
        .bind('pageup', 'Page up', { type: 'nav-page-up' }),
      ),

    layout(model) {
      const selectedId = model.listState.items[model.listState.focusIndex]?.value;

      return {
        kind: 'split',
        splitId: `${category.id}-split`,
        direction: 'row',
        state: createSplitPaneState({ ratio: 0.25 }),
        minA: 18,
        minB: 30,
        paneA: {
          kind: 'pane',
          paneId: `${category.id}-sidebar`,
          render: (w, h) => renderSidebar(model, w, h, category, ctx),
        },
        paneB: {
          kind: 'pane',
          paneId: `${category.id}-detail`,
          overflowX: 'scroll',
          render: (w, h) => contentSurface(renderDetail(selectedId, w, h, ctx)),
        },
      } satisfies FrameLayoutNode;
    },
  };
}
