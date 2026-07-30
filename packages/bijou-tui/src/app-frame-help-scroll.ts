import type {
  FrameShellCommand,
  InternalFrameModel,
} from './app-frame-types.js';
import { renderHelpOverlay } from './app-frame-overlays.js';
import { resolvePresentedLayerContext } from './app-frame-presentation.js';
import type { FrameShellCommandDependencies } from './app-frame-shell-command-contract.js';

type HelpScrollCommand<Msg> = Extract<
  FrameShellCommand<Msg>,
  { readonly type: 'help-scroll' }
>;

export function applyFrameHelpScroll<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  command: HelpScrollCommand<Msg>,
  dependencies: FrameShellCommandDependencies<PageModel, Msg>,
): InternalFrameModel<PageModel, Msg> {
  const helpSource = resolvePresentedLayerContext(
    model,
    dependencies.presentationDependencies,
  ).controlProjection.helpSource;
  if (helpSource == null) return model;
  const overlay = renderHelpOverlay(
    model,
    helpSource,
    dependencies.options.i18n,
  );
  const viewportHeight = Math.max(1, overlay.body.height - 1);
  const delta =
    command.action === 'down'
      ? 3
      : command.action === 'up'
        ? -3
        : command.action === 'page-down'
          ? viewportHeight
          : command.action === 'page-up'
            ? -viewportHeight
            : command.action === 'bottom'
              ? Infinity
              : -Infinity;
  return {
    ...model,
    helpScrollY: Math.max(
      0,
      Math.min(overlay.maxScrollY, overlay.scrollY + delta),
    ),
  };
}
