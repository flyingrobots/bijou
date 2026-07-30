import {
  createKeyMap,
  formatKeyCombo,
  type KeyCombo,
  type KeyMap,
  type KeyMsg,
} from '@flyingrobots/bijou-tui';

/** Merge enabled key bindings without mutating either source map. */
export function mergeKeyMaps<M>(
  base: KeyMap<M>,
  extra: KeyMap<M> | undefined,
): KeyMap<M> {
  if (extra == null) return base;
  const merged = createKeyMap<M>();
  bindMapInto(merged, base);
  bindMapInto(merged, extra);
  return merged;
}

function bindMapInto<M>(target: KeyMap<M>, source: KeyMap<M>): void {
  for (const binding of source.bindings()) {
    if (!binding.enabled) continue;
    const action = source.handle(comboToMsg(binding.combo));
    if (action === undefined) continue;
    if (binding.group !== '') {
      target.group(binding.group, (group) =>
        group.bind(
          formatKeyCombo(binding.combo),
          binding.description,
          action,
        ),
      );
    } else {
      target.bind(
        formatKeyCombo(binding.combo),
        binding.description,
        action,
      );
    }
  }
}

function comboToMsg(combo: KeyCombo): KeyMsg {
  return {
    type: 'key',
    key: combo.key,
    ctrl: combo.ctrl,
    alt: combo.alt,
    shift: combo.shift,
  };
}
