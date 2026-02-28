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

/**
 * Definition of a single panel within a panel group.
 *
 * @template A - Action type produced by the panel's key map.
 */
export interface PanelDef<A> {
  /** Unique identifier for this panel. */
  readonly id: string;
  /** Single key that focuses this panel when pressed. */
  readonly hotkey: string;
  /** Human-readable label displayed in the panel tab bar. */
  readonly label: string;
  /** Key map that handles input when this panel is focused. */
  readonly keyMap: KeyMap<A>;
}

/**
 * Configuration for creating a panel group.
 *
 * @template A - Action type produced by panel key maps.
 */
export interface PanelGroupOptions<A> {
  /** Panel definitions to include in the group. */
  readonly panels: readonly PanelDef<A>[];
  /** ID of the panel that is focused initially. Must match an existing panel. */
  readonly defaultFocus: string;
  /** Optional input stack for automatic layer management on focus changes. */
  readonly inputStack?: InputStack<KeyMsg, A>;
}

/**
 * Runtime panel group that tracks focus and routes input.
 *
 * @template A - Action type produced by panel key maps.
 */
export interface PanelGroup<A> {
  /** ID of the currently focused panel. */
  readonly focused: string;
  /**
   * Switch focus to the panel with the given ID.
   *
   * @param id - Target panel ID. No-op if already focused or ID is unknown.
   */
  focus(id: string): void;
  /**
   * Route a key message through hotkey detection and the focused panel's key map.
   *
   * @param msg - Incoming key event.
   * @returns Action from the focused panel's key map, or undefined if unmatched.
   */
  handle(msg: KeyMsg): A | undefined;
  /**
   * Format a panel label for display, applying focus-aware styling.
   *
   * @param id - Panel ID whose label to format.
   * @param ctx - Optional Bijou context for styled output.
   * @returns Formatted label string (plain if no ctx, styled otherwise).
   */
  formatLabel(id: string, ctx?: BijouContext): string;
  /**
   * Remove all input stack layers owned by this panel group.
   */
  dispose(): void;
}

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
