import type { BijouContext } from '@flyingrobots/bijou';
import { badge, box, kbd, markdown, surfaceToString } from '@flyingrobots/bijou';
import {
  animate,
  createBrowsableListState,
  createFramedApp,
  createKeyMap,
  createSplitPaneState,
  drawer,
  EASINGS,
  listFocusNext,
  listFocusPrev,
  listPageDown,
  listPageUp,
  modal,
  quit,
  timeline,
  type App,
  type FrameLayoutNode,
  type FrameModel,
  type FramePage,
  type Overlay,
} from '@flyingrobots/bijou-tui';
import type { ShowcaseMsg, ShowcasePageModel } from './types.js';
import { CATEGORIES, findEntry, type Category } from './registry.js';
import { triModePreview } from './tri-mode.js';
import { contentSurface } from '../_shared/example-surfaces.ts';

// ---------------------------------------------------------------------------
// Detail pane rendering
// ---------------------------------------------------------------------------

function badgeText(label: string, variant: Parameters<typeof badge>[1]['variant'], ctx: BijouContext): string {
  return surfaceToString(badge(label, { variant, ctx }), ctx.style);
}

function renderDetail(
  componentId: string | undefined,
  width: number,
  height: number,
  ctx: BijouContext,
): string {
  if (componentId == null) {
    return renderWelcomeContent(width, height, ctx);
  }
  const entry = findEntry(componentId);
  if (entry == null) {
    return '  Component not found.';
  }

  const innerW = Math.max(20, width - 2);
  const sections: string[] = [];

  // Header
  sections.push(markdown(entry.description, { width: innerW, ctx }));
  sections.push('');

  // Tier + package badge
  const tierBadge = entry.tier === 1
    ? badgeText('static', 'success', ctx)
    : entry.tier === 2
      ? badgeText('embeddable', 'info', ctx)
      : badgeText('standalone', 'warning', ctx);
  sections.push(`  ${tierBadge} ${badgeText(entry.pkg, 'muted', ctx)}`);
  sections.push('');

  // Tri-mode preview
  sections.push(triModePreview(entry.render, innerW, ctx));

  return sections.join('\n');
}

function renderWelcomeContent(width: number, _height: number, ctx: BijouContext): string {
  const w = Math.max(20, Math.min(52, width - 4));
  return [
    '',
    '',
    box([
      '  Select a component from the sidebar',
      '  to see its live preview and docs.',
      '',
      `  ${kbd('up', { ctx })}/${kbd('down', { ctx })}  Navigate sidebar`,
      `  ${kbd('[', { ctx })}/${kbd(']', { ctx })}     Switch categories`,
      `  ${kbd('tab', { ctx })}      Focus pane`,
      `  ${kbd('j', { ctx })}/${kbd('k', { ctx })}     Scroll content`,
      `  ${kbd('?', { ctx })}        Help`,
      `  ${kbd('q', { ctx })}        Quit`,
    ].join('\n'), {
      width: w,
      borderToken: ctx.border('muted'),
      ctx,
    }),
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Sidebar rendering
// ---------------------------------------------------------------------------

function renderSidebar(
  model: ShowcasePageModel,
  width: number,
  _height: number,
  category: Category,
  ctx: BijouContext,
): string {
  const items = model.listState.items;
  const focus = model.listState.focusIndex;
  const scrollY = model.listState.scrollY;
  const visibleCount = model.listState.height;
  const visible = items.slice(scrollY, scrollY + visibleCount);

  const lines: string[] = [];
  for (let i = 0; i < visible.length; i++) {
    const item = visible[i]!;
    const globalIdx = scrollY + i;
    const isFocused = globalIdx === focus;
    const entry = findEntry(item.value);
    const tier = entry?.tier ?? 1;
    const tierMark = tier === 3 ? ' *' : '';

    if (isFocused) {
      const label = ctx.style.styled(ctx.semantic('primary'), `> ${item.label}${tierMark}`);
      lines.push(label);
    } else {
      lines.push(`  ${item.label}${tierMark}`);
    }
  }

  // Scroll indicator
  if (items.length > visibleCount) {
    const pct = Math.round(((focus + 1) / items.length) * 100);
    lines.push('');
    lines.push(` ${focus + 1}/${items.length} (${pct}%)`);
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Page builder
// ---------------------------------------------------------------------------

function createCategoryPage(
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
      // Force quit always works
      if (msg.type === 'force-quit') {
        return [model, [quit()]];
      }

      // Quit confirmation modal intercepts
      if (model.quitConfirmOpen) {
        switch (msg.type) {
          case 'confirm-quit':
            return [model, [quit()]];
          case 'cancel-quit':
            return [{ ...model, quitConfirmOpen: false }, []];
          default:
            return [model, []];
        }
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
          // Close drawer if open, otherwise no-op
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
          render: (w, h) => contentSurface(renderSidebar(model, w, h, category, ctx)),
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

// ---------------------------------------------------------------------------
// App assembly
// ---------------------------------------------------------------------------

export function createShowcaseApp(
  ctx: BijouContext,
): App<FrameModel<ShowcasePageModel>, ShowcaseMsg> {
  const pages = CATEGORIES.map((cat, idx) => createCategoryPage(cat, idx === 0, ctx));

  return createFramedApp<ShowcasePageModel, ShowcaseMsg>({
    title: 'Bijou Component Showcase',
    pages,
    defaultPageId: 'display',
    enableCommandPalette: true,
    transition: 'dissolve',
    transitionTimeline: timeline()
      .add('progress', {
        type: 'tween',
        from: 0,
        to: 1,
        duration: 400,
        ease: EASINGS.easeInOutCubic,
      })
      .build(),
    globalKeys: createKeyMap<ShowcaseMsg>()
      .group('App', (g) => g
        .bind('q', 'Quit (confirm)', { type: 'request-quit' })
        .bind('ctrl+c', 'Force quit', { type: 'force-quit' })
        .bind('escape', 'Cancel / Close', { type: 'cancel-quit' })
        .bind('enter', 'Confirm quit', { type: 'confirm-quit' })
        .bind('o', 'Toggle welcome drawer', { type: 'toggle-drawer' }),
      ),
    overlayFactory(frame) {
      const overlays: Overlay[] = [];

      // Welcome drawer (animated, left side)
      const progress = clamp01(frame.pageModel.drawerProgress);
      if (progress > 0.01) {
        const idealWidth = Math.max(28, Math.floor(frame.screenRect.width * 0.3));
        const animatedWidth = Math.max(6, Math.round(idealWidth * progress));

        overlays.push(drawer({
          anchor: 'left',
          title: 'Welcome',
          content: renderDrawerContent(ctx),
          width: animatedWidth,
          screenWidth: frame.screenRect.width,
          screenHeight: frame.screenRect.height,
          borderToken: ctx.border('primary'),
          bgToken: ctx.surface('elevated'),
          ctx,
        }));
      }

      // Quit confirmation modal
      if (frame.pageModel.quitConfirmOpen) {
        overlays.push(modal({
          title: 'Quit Showcase?',
          body: 'Exit the component showcase?\n\nEnter = Yes\nEsc = No',
          hint: 'q request  |  enter confirm  |  esc cancel',
          width: Math.min(48, Math.max(34, frame.screenRect.width - 4)),
          screenWidth: frame.screenRect.width,
          screenHeight: frame.screenRect.height,
          borderToken: ctx.border('primary'),
          bgToken: ctx.surface('elevated'),
          ctx,
        }));
      }

      return overlays;
    },
  });
}

// ---------------------------------------------------------------------------
// Drawer content
// ---------------------------------------------------------------------------

function renderDrawerContent(ctx: BijouContext): string {
  const total = CATEGORIES.reduce((n, c) => n + c.entries.length, 0);
  return [
    'Bijou Component Showcase',
    '',
    `${total} components across`,
    `${CATEGORIES.length} categories.`,
    '',
    `${kbd('up', { ctx })}/${kbd('down', { ctx })}  Navigate`,
    `${kbd('[', { ctx })}/${kbd(']', { ctx })}     Categories`,
    `${kbd('tab', { ctx })}      Focus pane`,
    `${kbd('j', { ctx })}/${kbd('k', { ctx })}     Scroll detail`,
    `${kbd('ctrl+p', { ctx })} Command palette`,
    `${kbd('?', { ctx })}        Full help`,
    `${kbd('o', { ctx })}        Close this drawer`,
    `${kbd('q', { ctx })}        Quit`,
    '',
    '* = standalone only',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
