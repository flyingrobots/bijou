// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A parsed key descriptor: the key name + modifier flags. */
export interface KeyCombo {
  /** Key name (e.g. `"q"`, `"enter"`, `"tab"`). */
  readonly key: string;
  /** Whether the Ctrl modifier is required. */
  readonly ctrl: boolean;
  /** Whether the Alt modifier is required. */
  readonly alt: boolean;
  /** Whether the Shift modifier is required. */
  readonly shift: boolean;
}

/**
 * A single registered binding associating a key combo with an action.
 *
 * @template A - Action type returned when this binding matches.
 */
export interface Binding<A> {
  /** Key combination that triggers this binding. */
  readonly combo: KeyCombo;
  /** Human-readable description for help text. */
  readonly description: string;
  /** Group name this binding belongs to (empty string if ungrouped). */
  readonly group: string;
  /** Action to return when this binding matches. */
  readonly action: A;
  /** Whether this binding is currently active. */
  enabled: boolean;
}

/** Read-only view of a binding for help generation and introspection. */
export interface BindingInfo {
  /** Key combination that triggers this binding. */
  readonly combo: KeyCombo;
  /** Human-readable description for help text. */
  readonly description: string;
  /** Group name this binding belongs to. */
  readonly group: string;
  /** Whether this binding is currently active. */
  readonly enabled: boolean;
}

/**
 * Group builder — same as KeyMap but scoped to a group name.
 *
 * @template A - Action type returned when a binding matches.
 */
export interface KeyMapGroup<A> {
  /**
   * Register a binding within this group.
   *
   * @param key - Key descriptor string (e.g. `"j"`, `"ctrl+c"`).
   * @param description - Human-readable description for help text.
   * @param action - Action to return when this binding matches.
   * @returns This group builder for chaining.
   */
  bind(key: string, description: string, action: A): KeyMapGroup<A>;
}
