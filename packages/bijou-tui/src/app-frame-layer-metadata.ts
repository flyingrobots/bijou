import type { BindingSource } from './help.js';
import type { KeyMap } from './keybindings.js';
import type { FrameInputArea, FramePage } from './app-frame-page-contract.js';
import type { InternalFrameModel } from './app-frame-types.js';
import type { FrameLayerKind, FrameLayerMetadata } from './app-frame-layers.js';
import type { ResolvedFrameShellTheme } from './app-frame-overlays.js';
import {
  resolveFrameNotificationCenter,
  resolveFrameSettings,
} from './app-frame-overlays.js';
import {
  frameMessage,
  frameNotificationFilterLabel,
} from './app-frame-i18n.js';
import {
  mergeBindingSources,
  resolveFramePageText,
} from './app-frame-utils.js';
import {
  resolveWorkspaceHelpSource,
  resolveWorkspaceHintSource,
  type FrameHintDependencies,
} from './app-frame-hint-sources.js';

export interface FrameLayerMetadataDependencies<PageModel, Msg>
  extends FrameHintDependencies<PageModel, Msg> {
  readonly pagesById: Map<string, FramePage<PageModel, Msg>>;
  readonly resolvedShellThemes: () => readonly ResolvedFrameShellTheme[];
  readonly helpLayerHelpKeys: BindingSource;
  readonly settingsHelpKeys: BindingSource;
  readonly notificationCenterHelpKeys: BindingSource;
  readonly quitConfirmHelpKeys: BindingSource;
  readonly paletteKeys: BindingSource;
}

export function resolveLayerMetadata<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  activePage: FramePage<PageModel, Msg>,
  activePageModel: PageModel,
  activeInputArea: FrameInputArea<PageModel, Msg> | undefined,
  modalKeyMap: KeyMap<Msg> | undefined,
  dependencies: FrameLayerMetadataDependencies<PageModel, Msg>,
): Partial<Record<FrameLayerKind, FrameLayerMetadata>> {
  const { options } = dependencies;
  const settings = resolveFrameSettings(
    model,
    options,
    dependencies.pagesById,
    dependencies.resolvedShellThemes(),
  );
  const center = resolveFrameNotificationCenter(
    model,
    options,
    dependencies.pagesById,
  );
  const workspaceHintSource = resolveWorkspaceHintSource(
    model,
    activePage,
    activeInputArea,
    dependencies,
  );
  const workspaceHelpSource = resolveWorkspaceHelpSource(
    activePage,
    activeInputArea,
    dependencies,
  );
  const message = (id: string, fallback: string) =>
    frameMessage(options.i18n, id, fallback);
  const paletteHint = message('palette.hint', 'Enter select • Esc close');
  const activePageTitle =
    resolveFramePageText(activePage.title, activePageModel) ?? '';
  const searchTitle =
    model.commandPaletteTitle ??
    resolveFramePageText(activePage.searchTitle, activePageModel) ??
    message('search.title', 'Search');
  const notificationTitle =
    center == null
      ? message('notifications.title', 'Notifications')
      : `${center.title} • ${frameNotificationFilterLabel(options.i18n, center.activeFilter)}`;
  const pageLayers = activePage.layers?.(activePageModel);
  return {
    workspace: {
      title: activePageTitle,
      hintSource: workspaceHintSource,
      helpSource: workspaceHelpSource,
      ...pageLayers?.workspace,
    },
    'page-modal': {
      title: activePageTitle,
      hintSource: modalKeyMap ?? activePage.helpSource ?? activePage.keyMap,
      helpSource: mergeBindingSources(
        dependencies.quitHelpKeys,
        modalKeyMap,
        activePage.helpSource ?? activePage.keyMap,
      ),
      ...pageLayers?.['page-modal'],
    },
    settings: {
      title: settings?.title ?? message('settings.title', 'Settings'),
      hintSource: message('settings.footer', 'F2/Esc close • ↑/↓ rows • Enter toggle • / search • q quit'),
      helpSource: mergeBindingSources(
        dependencies.settingsHelpKeys,
        dependencies.quitHelpKeys,
      ),
    },
    help: {
      title: message('help.title', 'Keyboard Help'),
      hintSource: message('help.hint', 'j/k scroll • d/u page • g/G top/bottom • mouse wheel • ?/Esc close'),
      helpSource: dependencies.helpLayerHelpKeys,
    },
    'notification-center': {
      title: notificationTitle,
      hintSource: message('notifications.footer', 'Shift+N close • f filter • j/k scroll • q quit'),
      helpSource: mergeBindingSources(
        dependencies.notificationCenterHelpKeys,
        dependencies.quitHelpKeys,
      ),
    },
    search: {
      title: searchTitle,
      hintSource: paletteHint,
      helpSource: mergeBindingSources(
        dependencies.paletteKeys,
        dependencies.quitHelpKeys,
      ),
    },
    'command-palette': {
      title:
        model.commandPaletteTitle ??
        message('palette.title', 'Command Palette'),
      hintSource: paletteHint,
      helpSource: mergeBindingSources(
        dependencies.paletteKeys,
        dependencies.quitHelpKeys,
      ),
    },
    'quit-confirm': {
      title: message('quit.title', 'Quit?'),
      hintSource: message('quit.footer', 'Y Quit • N Stay'),
      helpSource: dependencies.quitConfirmHelpKeys,
    },
  };
}
