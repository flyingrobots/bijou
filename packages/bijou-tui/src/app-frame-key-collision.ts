import { resolveClock } from '@flyingrobots/bijou';
import { formatKeyCombo, type BindingInfo } from './keybindings.js';
import type { Cmd, KeyMsg } from './types.js';
import type {
  FramedAppMsg,
  InternalFrameModel,
} from './app-frame-types.js';
import { wrapFrameMsg } from './app-frame-types.js';
import type { FrameShellCommandDependencies } from './app-frame-shell-command-contract.js';

const bindingComboKey = (binding: BindingInfo): string => {
  const combo = binding.combo;
  return [
    combo.key,
    combo.ctrl ? '1' : '0',
    combo.alt ? '1' : '0',
    combo.shift ? '1' : '0',
  ].join('|');
};

const findBindingForMessage = (
  bindings: readonly BindingInfo[],
  msg: KeyMsg,
): BindingInfo | undefined => {
  const comboKey = [
    msg.key,
    msg.ctrl ? '1' : '0',
    msg.alt ? '1' : '0',
    msg.shift ? '1' : '0',
  ].join('|');
  return bindings.find(
    (binding) => binding.enabled && bindingComboKey(binding) === comboKey,
  );
};

export function queueFrameKeyCollisionWarning<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  msg: KeyMsg,
  teaCmds: Cmd<FramedAppMsg<Msg>>[],
  dependencies: FrameShellCommandDependencies<PageModel, Msg>,
): InternalFrameModel<PageModel, Msg> {
  const { frameNotificationOptions, frameKeys, options, pagesById } =
    dependencies;
  if (!frameNotificationOptions.enabled) return model;
  if ((options.keyPriority ?? 'frame-first') !== 'frame-first') return model;
  if (model.warnedFrameKeyCollisionPages[model.activePageId]) return model;
  const pageBinding = findBindingForMessage(
    pagesById.get(model.activePageId)?.keyMap?.bindings() ?? [],
    msg,
  );
  const frameBinding = findBindingForMessage(frameKeys.bindings(), msg);
  if (pageBinding == null || frameBinding == null) return model;
  teaCmds.push(() =>
    wrapFrameMsg({
      type: 'runtime-issue',
      issue: {
        level: 'warning',
        source: 'runtime',
        message:
          `Page "${model.activePageId}" key binding ${formatKeyCombo(pageBinding.combo)} ` +
          `("${pageBinding.description}") is shadowed by the frame binding ` +
          `"${frameBinding.description}" under keyPriority="frame-first". ` +
          `Use keyPriority: 'page-first' or choose a different page binding.`,
        atMs: resolveClock(dependencies.resolveFrameCtx()).now(),
      },
    }),
  );
  return {
    ...model,
    warnedFrameKeyCollisionPages: {
      ...model.warnedFrameKeyCollisionPages,
      [model.activePageId]: true,
    },
  };
}
