import type { BijouContext } from '@flyingrobots/bijou';
import type { InputStack } from './inputstack.js';
import type { KeyMap } from './keybindings.js';
import type { KeyMsg } from './types.js';

export interface PanelDef<Action> {
  readonly id: string;
  readonly hotkey: string;
  readonly label: string;
  readonly keyMap: KeyMap<Action>;
}

export interface PanelGroupOptions<Action> {
  readonly panels: readonly PanelDef<Action>[];
  readonly defaultFocus: string;
  readonly inputStack?: InputStack<KeyMsg, Action>;
}

export interface PanelGroup<Action> {
  readonly focused: string;
  focus(id: string): void;
  handle(message: KeyMsg): Action | undefined;
  formatLabel(id: string, context?: BijouContext): string;
  dispose(): void;
}
