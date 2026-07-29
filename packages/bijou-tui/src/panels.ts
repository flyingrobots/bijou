/**
 * Multi-pane focus management for TUI applications.
 *
 * Each panel has a hotkey, label, and its own KeyMap. The group tracks
 * which panel is focused, routes input to the active panel's keymap,
 * and switches focus on hotkey press.
 */

import type { KeyMsg } from './types.js';
import type { PanelDef, PanelGroup, PanelGroupOptions } from './panel-types.js';
import { formatPanelLabel } from './panel-label.js';

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Create a panel group that manages focus and input routing across panels.
 *
 * Register hotkey and panel layers on the optional input stack. Hotkey presses
 * switch focus; the focused panel's key map handles all other input.
 *
 * @template A - Action type produced by panel key maps.
 * @param options - Panel group configuration.
 * @returns Panel group instance with focus management and input routing.
 * @throws {Error} If `defaultFocus` does not match any panel ID.
 */
export function createPanelGroup<A>(
  options: PanelGroupOptions<A>,
): PanelGroup<A> {
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
        const panel = panelMap.get(id);
        if (panel === undefined) return;
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

    formatLabel(id, context): string {
      return formatPanelLabel(panelMap.get(id), id === focusedId, context);
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

export type { PanelDef, PanelGroup, PanelGroupOptions } from './panel-types.js';
