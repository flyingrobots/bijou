import type { BindingInfo } from './keybindings.js';

/** Anything that can enumerate registered key bindings. */
export interface BindingSource {
  /** Return all registered key bindings. */
  bindings(): readonly BindingInfo[];
}

/** Filtering and formatting options for text help views. */
export interface HelpOptions {
  /** Only show enabled bindings. Defaults to `true`. */
  enabledOnly?: boolean;
  /** Include only groups matching this case-insensitive prefix. */
  groupFilter?: string;
  /** Separate each formatted key from its description. Defaults to two spaces. */
  separator?: string;
  /** Add a title above the grouped help. */
  title?: string;
  /** Label bindings without a group. Defaults to `General`. */
  defaultGroupName?: string;
}

/** Text help options plus optional `Surface` dimensions. */
export interface HelpSurfaceOptions extends HelpOptions {
  /** Fixed minimum width. Defaults to the widest visible line. */
  width?: number;
  /** Fixed height. Defaults to the rendered line count. */
  height?: number;
}
