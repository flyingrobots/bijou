import type { Theme } from '../../packages/bijou/src/index.js';
import type { FrameModel, KeyMsg } from '../../packages/bijou-tui/src/index.js';
import {
  themeLabEditorStateFor,
  themeLabEditorUpdateForKey,
  type ThemeLabEditorState,
} from './app-theme-lab-editor-model.js';

export type { ThemeLabEditorState } from './app-theme-lab-editor-model.js';

export interface ThemeLabEditorPageModel {
  readonly selectedGuideId?: string;
  readonly activeShellThemeId?: string;
  readonly themeLabEditor?: ThemeLabEditorState;
}

export interface ThemeLabEditorShellTheme {
  readonly id: string;
  readonly theme: Theme;
}

export interface ThemeLabEditorKeyOptions {
  readonly pageId: string;
  readonly guideId: string;
  resolveShellThemeById(id: string | undefined): ThemeLabEditorShellTheme;
}

export function updateThemeLabEditorFromKey<PageModel extends ThemeLabEditorPageModel>(
  docsModel: FrameModel<PageModel>,
  msg: KeyMsg,
  options: ThemeLabEditorKeyOptions,
): FrameModel<PageModel> | undefined {
  if (!shouldRouteThemeLabEditorKey(docsModel, msg, options)) return undefined;
  const pageModel = docsModel.pageModels[options.pageId];
  if (pageModel === undefined) return undefined;
  const activeTheme = options.resolveShellThemeById(pageModel.activeShellThemeId);
  const nextEditor = themeLabEditorUpdateForKey(
    themeLabEditorStateFor(activeTheme.id, activeTheme.theme, pageModel.themeLabEditor),
    activeTheme.theme,
    msg.key,
  );
  if (nextEditor === undefined) return undefined;
  return {
    ...docsModel,
    pageModels: {
      ...docsModel.pageModels,
      [options.pageId]: { ...pageModel, themeLabEditor: nextEditor },
    },
  };
}

function shouldRouteThemeLabEditorKey<PageModel extends ThemeLabEditorPageModel>(
  docsModel: FrameModel<PageModel>,
  msg: KeyMsg,
  options: ThemeLabEditorKeyOptions,
): boolean {
  if (docsModel.activePageId !== options.pageId) return false;
  if (docsModel.focusedPaneByPage[options.pageId] !== 'guide-content') return false;
  if (docsModel.commandPalette !== undefined) return false;
  if (docsModel.helpOpen || docsModel.notificationCenterOpen || docsModel.quitConfirmOpen || docsModel.settingsOpen) {
    return false;
  }
  if (msg.ctrl || msg.alt || msg.shift) return false;
  return docsModel.pageModels[options.pageId]?.selectedGuideId === options.guideId;
}
