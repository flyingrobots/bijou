import type { BindingSource } from './help.js';
import type { KeyMap } from './keybindings.js';
import type { CreateFramedAppOptions } from './app-frame-options.js';
import type {
  FrameInputArea,
  FramePage,
} from './app-frame-page-contract.js';
import type {
  FrameAction,
  InternalFrameModel,
} from './app-frame-types.js';
import type { FrameLayerHintSource } from './app-frame-layers.js';
import { mergeBindingSources } from './app-frame-utils.js';

export interface FrameHintDependencies<PageModel, Msg> {
  readonly options: CreateFramedAppOptions<PageModel, Msg>;
  readonly frameKeys: KeyMap<FrameAction>;
  readonly quitHelpKeys: BindingSource;
}

export function resolveWorkspaceHelpSource<PageModel, Msg>(
  activePage: FramePage<PageModel, Msg>,
  activeInputArea: FrameInputArea<PageModel, Msg> | undefined,
  dependencies: FrameHintDependencies<PageModel, Msg>,
): BindingSource {
  return mergeBindingSources(
    dependencies.frameKeys,
    dependencies.quitHelpKeys,
    dependencies.options.globalKeys,
    activeInputArea?.helpSource ?? activeInputArea?.keyMap,
    activePage.helpSource ?? activePage.keyMap,
  );
}

export function resolveWorkspaceHintSource<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  activePage: FramePage<PageModel, Msg>,
  activeInputArea: FrameInputArea<PageModel, Msg> | undefined,
  dependencies: FrameHintDependencies<PageModel, Msg>,
): FrameLayerHintSource | undefined {
  const override = dependencies.options.helpLineSource?.({
    model,
    activePage,
    frameKeys: dependencies.frameKeys,
    globalKeys: dependencies.options.globalKeys,
  });
  if (typeof override === 'string') return override;
  return (
    override ??
    mergeBindingSources(
      dependencies.frameKeys,
      dependencies.options.globalKeys,
      activeInputArea?.helpSource ?? activeInputArea?.keyMap,
      activePage.helpSource ?? activePage.keyMap,
    )
  );
}
