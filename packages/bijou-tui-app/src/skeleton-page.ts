import {
  animate,
  quit,
  type Cmd,
  type FramePageMsg,
} from '@flyingrobots/bijou-tui';
import type {
  SkeletonMsg,
  SkeletonPageConfig,
  SkeletonPageModel,
  SkeletonPageSpec,
  SkeletonTab,
} from './skeleton-contract.js';

/** Map tabs to built-in or consumer-owned page shapes. */
export function buildPageSpecs(
  tabs: readonly SkeletonTab[],
): readonly SkeletonPageSpec[] {
  return tabs.map((tab, index) => ({
    tab,
    kind: tab.render != null || tab.layout != null
      ? 'custom'
      : (index === 0 ? 'drawer' : (index === 1 ? 'split' : 'empty')),
  }));
}

/** Derive drawer ownership from a page spec. */
export function pageConfigFor(
  spec: SkeletonPageSpec,
): SkeletonPageConfig {
  return spec.kind === 'drawer'
    ? { hasDrawer: true, drawerPaneId: drawerPaneId(spec.tab.id) }
    : { hasDrawer: false };
}

/** Create the initial page-owned shell state. */
export function createInitialPageModel(
  config: SkeletonPageConfig,
): SkeletonPageModel {
  return {
    ready: true,
    drawerOpen: config.hasDrawer,
    drawerProgress: config.hasDrawer ? 1 : 0,
    quitConfirmOpen: false,
  };
}

/** Apply a skeleton message without taking ownership of host input messages. */
export function updateSkeletonPage(
  msg: FramePageMsg<SkeletonMsg>,
  model: SkeletonPageModel,
  config: SkeletonPageConfig,
): [SkeletonPageModel, Cmd<SkeletonMsg>[]] {
  if (msg.type === 'mouse' || msg.type === 'pulse') return [model, []];
  switch (msg.type) {
    case 'request-quit':
      return model.quitConfirmOpen
        ? [model, []]
        : [{ ...model, quitConfirmOpen: true }, []];
    case 'cancel-quit':
      return !model.quitConfirmOpen
        ? [model, []]
        : [{ ...model, quitConfirmOpen: false }, []];
    case 'confirm-quit':
      return !model.quitConfirmOpen
        ? [model, []]
        : [{ ...model, quitConfirmOpen: false }, [quit()]];
    case 'toggle-drawer': {
      if (!config.hasDrawer) return [model, []];
      const drawerOpen = !model.drawerOpen;
      return [{ ...model, drawerOpen }, [
        animate({
          from: model.drawerProgress,
          to: drawerOpen ? 1 : 0,
          spring: 'default',
          onFrame: (value: number): SkeletonMsg => ({
            type: 'drawer-progress',
            value,
          }),
        }),
      ]];
    }
    case 'drawer-progress':
      return !config.hasDrawer
        ? [model, []]
        : [{ ...model, drawerProgress: clamp01(msg.value) }, []];
  }
}

export function drawerPaneId(tabId: string): string {
  return `${tabId}-main`;
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value > 1 ? 1 : value;
}
