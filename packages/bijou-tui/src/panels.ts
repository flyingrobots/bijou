/**
 * Multi-pane focus management for TUI applications.
 *
 * Each panel has a hotkey, label, and its own KeyMap. The group tracks
 * which panel is focused, routes input to the active panel's keymap,
 * and switches focus on hotkey press.
 */

import type { KeyMsg } from './types.js';
import type { KeyMap } from './keybindings.js';
import type { InputStack } from './inputstack.js';
import type { BijouContext } from '@flyingrobots/bijou';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PanelDef<A> {
  readonly id: string;
  readonly hotkey: string;
  readonly label: string;
  readonly keyMap: KeyMap<A>;
}

export interface PanelGroupOptions<A> {
  readonly panels: readonly PanelDef<A>[];
  readonly defaultFocus: string;
  readonly inputStack?: InputStack<KeyMsg, A>;
}

export interface PanelGroup<A> {
  readonly focused: string;
  focus(id: string): void;
  handle(msg: KeyMsg): A | undefined;
  formatLabel(id: string, ctx?: BijouContext): string;
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function createPanelGroup<A>(options: PanelGroupOptions<A>): PanelGroup<A> {
  const panelMap = new Map<string, PanelDef<A>>();
  const hotkeyMap = new Map<string, string>();

  for (const panel of options.panels) {
    panelMap.set(panel.id, panel);
    hotkeyMap.set(panel.hotkey, panel.id);
  }

  if (!panelMap.has(options.defaultFocus)) {
    throw new Error(
      `createPanelGroup: defaultFocus "${options.defaultFocus}" does not match any panel id. ` +
      `Available: ${[...panelMap.keys()].join(', ')}`,
    );
  }

  let focusedId = options.defaultFocus;
  const { inputStack } = options;

  let hotkeyLayerId: number | undefined;
  let panelLayerId: number | undefined;

  if (inputStack) {
    // Hotkey layer: passthrough, handles hotkey presses
    hotkeyLayerId = inputStack.push(
      {
        handle(msg: KeyMsg): A | undefined {
          if (!msg.ctrl && !msg.alt && !msg.shift) {
            const targetId = hotkeyMap.get(msg.key);
            if (targetId !== undefined && targetId !== focusedId) {
              group.focus(targetId);
            }
          }
          return undefined;
        },
      },
      { passthrough: true, name: 'panel-group:hotkeys' },
    );

    // Focused panel keymap layer
    const focusedPanel = panelMap.get(focusedId);
    if (focusedPanel) {
      panelLayerId = inputStack.push(focusedPanel.keyMap, {
        passthrough: true,
        name: `panel:${focusedId}`,
      });
    }
  }

  const group: PanelGroup<A> = {
    get focused(): string {
      return focusedId;
    },

    focus(id: string): void {
      if (!panelMap.has(id) || id === focusedId) return;

      focusedId = id;

      if (inputStack && panelLayerId !== undefined) {
        inputStack.remove(panelLayerId);
        const panel = panelMap.get(id)!;
        panelLayerId = inputStack.push(panel.keyMap, {
          passthrough: true,
          name: `panel:${id}`,
        });
      }
    },

    handle(msg: KeyMsg): A | undefined {
      // Check hotkeys first (only plain keys, no modifiers)
      if (!msg.ctrl && !msg.alt && !msg.shift) {
        const targetId = hotkeyMap.get(msg.key);
        if (targetId !== undefined && targetId !== focusedId) {
          group.focus(targetId);
          return undefined;
        }
      }

      // Delegate to focused panel's keymap
      const panel = panelMap.get(focusedId);
      if (panel) {
        return panel.keyMap.handle(msg);
      }
      return undefined;
    },

    formatLabel(id: string, ctx?: BijouContext): string {
      const panel = panelMap.get(id);
      if (!panel) return '';

      if (!ctx) {
        return `[${panel.hotkey}] ${panel.label}`;
      }

      const style = ctx.style;
      const semantic = ctx.theme.theme.semantic;

      if (id === focusedId) {
        return style.bold(style.styled(semantic.primary, panel.label));
      }
      return style.styled(semantic.muted, panel.label);
    },

    dispose(): void {
      if (inputStack) {
        if (panelLayerId !== undefined) {
          inputStack.remove(panelLayerId);
          panelLayerId = undefined;
        }
        if (hotkeyLayerId !== undefined) {
          inputStack.remove(hotkeyLayerId);
          hotkeyLayerId = undefined;
        }
      }
    },
  };

  return group;
}
