import type {
  LayoutNode as SurfaceLayoutNode,
} from '@flyingrobots/bijou';
import type { CreateFramedAppOptions } from './app-frame-options.js';
import type { FramePage } from './app-frame-page-contract.js';
import type { InternalFrameModel } from './app-frame-types.js';
import type { ResolvedFrameShellTheme, ResolvedSettingsLayout } from './app-frame-overlays.js';
import {
  clampSettingsScroll,
  resolveNotificationCenterLayout,
  resolveSettingsLayout,
} from './app-frame-overlays.js';
import {
  createRuntimeRetainedLayouts,
  retainRuntimeLayout,
} from './runtime-engine.js';
import type { WorkspaceLayoutServices } from './app-frame-workspace-layout.js';
import {
  createShellRetainedLayoutNode,
} from './app-frame-workspace-tree.js';

const EMPTY_RUNTIME_LAYOUTS = createRuntimeRetainedLayouts();

const settingsRowChildren = <PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  layout: ResolvedSettingsLayout<Msg>,
): SurfaceLayoutNode[] => {
  const scrollY = clampSettingsScroll(model, layout);
  const children: SurfaceLayoutNode[] = [];
  for (const row of layout.rows) {
    const screenRow = row.line - scrollY + 1;
    const clippedTop = Math.max(1, screenRow);
    const clippedBottom = Math.min(model.rows - 1, screenRow + row.height);
    if (clippedTop >= clippedBottom) continue;
    children.push(
      createShellRetainedLayoutNode(`settings-row:${String(row.index)}`, {
        row: clippedTop,
        col: layout.startCol,
        width: layout.drawerWidth,
        height: clippedBottom - clippedTop,
      }),
    );
  }
  return children;
};

export interface MouseLayoutDependencies<PageModel, Msg> {
  readonly options: CreateFramedAppOptions<PageModel, Msg>;
  readonly pagesById: Map<string, FramePage<PageModel, Msg>>;
  readonly resolveShellThemes: () => readonly ResolvedFrameShellTheme[];
  readonly workspace: WorkspaceLayoutServices<PageModel, Msg>;
  readonly resolveThemeContext: (
    shellThemeId: string | undefined,
  ) => import('@flyingrobots/bijou').BijouContext | undefined;
}

export function resolveFrameMouseRuntimeLayouts<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  dependencies: MouseLayoutDependencies<PageModel, Msg>,
) {
  let layouts = EMPTY_RUNTIME_LAYOUTS;
  const settings = model.settingsOpen
    ? resolveSettingsLayout(
        model,
        dependencies.options,
        dependencies.pagesById,
        dependencies.resolveShellThemes(),
      )
    : undefined;
  if (settings != null) {
    layouts = retainRuntimeLayout(layouts, {
      viewId: 'settings',
      tree: createShellRetainedLayoutNode(
        'settings-drawer',
        {
          row: 0,
          col: settings.startCol,
          width: settings.drawerWidth,
          height: model.rows,
        },
        settingsRowChildren(model, settings),
      ),
    });
  }
  const notifications = model.notificationCenterOpen
    ? resolveNotificationCenterLayout(
        model,
        dependencies.options,
        dependencies.pagesById,
        dependencies.resolveThemeContext(model.activeShellThemeId),
      )
    : undefined;
  if (notifications != null) {
    layouts = retainRuntimeLayout(layouts, {
      viewId: 'notification-center',
      tree: createShellRetainedLayoutNode('notification-center-drawer', {
        row: 0,
        col: notifications.startCol,
        width: notifications.drawerWidth,
        height: model.rows,
      }),
    });
  }
  return retainRuntimeLayout(layouts, {
    viewId: 'workspace',
    tree: dependencies.workspace.tree(model),
  });
}

export function nodeIdSuffix(
  node: SurfaceLayoutNode,
  prefix: string,
): string | undefined {
  return node.id?.startsWith(prefix) === true
    ? node.id.slice(prefix.length)
    : undefined;
}
