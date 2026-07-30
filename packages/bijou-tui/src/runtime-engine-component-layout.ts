export const RUNTIME_COMPONENT_SIZE_MODES = [
  "content",
  "fill",
  "fixed",
] as const;

export const RUNTIME_COMPONENT_ALIGNMENTS = [
  "start",
  "center",
  "end",
  "stretch",
] as const;

export const RUNTIME_COMPONENT_INLINE_OVERFLOW_POLICIES = [
  "clip",
  "truncate",
  "viewport",
] as const;

export const RUNTIME_COMPONENT_BLOCK_OVERFLOW_POLICIES = [
  "wrap",
  "stack",
  "clip",
  "viewport",
] as const;

export type RuntimeComponentSizeMode =
  (typeof RUNTIME_COMPONENT_SIZE_MODES)[number];

export type RuntimeComponentAlignment =
  (typeof RUNTIME_COMPONENT_ALIGNMENTS)[number];

export type RuntimeComponentInlineOverflowPolicy =
  (typeof RUNTIME_COMPONENT_INLINE_OVERFLOW_POLICIES)[number];

export type RuntimeComponentBlockOverflowPolicy =
  (typeof RUNTIME_COMPONENT_BLOCK_OVERFLOW_POLICIES)[number];

export interface RuntimeComponentLayoutRules {
  readonly width: RuntimeComponentSizeMode;
  readonly height: RuntimeComponentSizeMode;
  readonly alignX: RuntimeComponentAlignment;
  readonly alignY: RuntimeComponentAlignment;
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly minHeight?: number;
  readonly maxHeight?: number;
  readonly fixedWidth?: number;
  readonly fixedHeight?: number;
}

export interface RuntimeComponentOverflowRules {
  readonly inline: RuntimeComponentInlineOverflowPolicy;
  readonly block: RuntimeComponentBlockOverflowPolicy;
}
