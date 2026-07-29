import type { BijouContext } from '@flyingrobots/bijou';
import type { PanelDef } from './panel-types.js';

export function formatPanelLabel<Action>(
  panel: PanelDef<Action> | undefined,
  focused: boolean,
  context?: BijouContext,
): string {
  if (panel === undefined) return '';
  if (!context) {
    return `[${panel.hotkey}] ${panel.label}`;
  }
  return focused
    ? context.style.bold(
        context.style.styled(context.semantic('primary'), panel.label),
      )
    : context.style.styled(context.semantic('muted'), panel.label);
}
