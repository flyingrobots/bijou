export interface ToolInteractionProfiles {
  readonly interactive: string;
  readonly static: string;
  readonly pipe: string;
  readonly accessible: string;
}

export interface ToolDocsCatalogEntry {
  readonly toolName: string;
  readonly family: string;
  readonly category: string;
  readonly summary: string;
  readonly aliases: readonly string[];
  readonly useWhen: readonly string[];
  readonly avoidWhen: readonly string[];
  readonly interactionProfiles?: Partial<ToolInteractionProfiles>;
  readonly related: readonly string[];
  readonly exampleArgs?: Record<string, unknown>;
}

export const DEFAULT_INTERACTION_PROFILES: ToolInteractionProfiles = {
  interactive: 'Rendered through a plain-style interactive context with Unicode structure and no ANSI color.',
  static: 'Matches the interactive MCP output because the wrapper returns a plain-text rendering rather than a live terminal state.',
  pipe: 'Not separately lowered by the MCP wrapper; the returned result is already plain text suitable for logs, prompts, and transcripts.',
  accessible: 'No dedicated accessible lowering is exposed by this MCP wrapper yet, so callers should treat the plain-text structure as the accessible fallback.',
};

export const DEFAULT_DOCS_ONLY_INTERACTION_PROFILES: ToolInteractionProfiles = {
  interactive: 'No dedicated MCP render tool is exposed today. bijou_docs documents this first-party family directly and can synthesize a representative plain-text example when examples are requested.',
  static: 'Matches the docs-only interactive sample because bijou_docs returns a plain-text reference rendering rather than a live terminal session.',
  pipe: 'The synthesized example output is already plain text suitable for logs, prompts, and transcripts.',
  accessible: 'No dedicated accessible lowering is exposed for this docs-only entry yet, so callers should treat the plain-text sample and guidance as the accessible fallback.',
};
