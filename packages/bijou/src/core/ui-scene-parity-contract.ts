export const UI_SCENE_PARITY_VERSION = 'ui-scene-parity/1' as const;

export type UiSceneParityVersion = typeof UI_SCENE_PARITY_VERSION;

/** A scene fact that the witness reads from a lowered output. */
export type UiSceneParityFact =
  | 'node'
  | 'x'
  | 'y'
  | 'text'
  | 'source'
  | 'i18n-key'
  | 'fg-token'
  | 'bg-token'
  | 'fg-color'
  | 'bg-color'
  | 'modifiers'
  | 'role'
  | 'component'
  | 'action'
  | 'binding'
  | 'border-token'
  | 'checked'
  | 'width'
  | 'height';

/**
 * A named difference that follows from a stated rule of one target. The
 * witness reports a gap only after it has checked that rule.
 */
export type UiSceneParityGap =
  | 'group-not-drawn'
  | 'text-not-visible'
  | 'text-clipped'
  | 'text-sanitized'
  | 'text-overdrawn'
  | 'coordinate-normalized'
  | 'browser-only-fact';

export type UiSceneParityStatus = 'equal' | 'gap' | 'mismatch';

/**
 * One fact of one node, as each output states it. `terminal` or `browser` is
 * absent when that output does not carry the fact.
 */
export interface UiSceneParityFinding {
  readonly nodeId: string;
  readonly fact: UiSceneParityFact;
  readonly status: UiSceneParityStatus;
  readonly gap?: UiSceneParityGap;
  readonly terminal?: string;
  readonly browser?: string;
}

export interface UiSceneParityComparison {
  readonly witnessVersion: UiSceneParityVersion;
  readonly status: 'compared';
  readonly sceneHash: string;
  readonly surfaceHash: string;
  readonly markupHash: string;
  /** In browser tree order, then by fact. */
  readonly findings: readonly UiSceneParityFinding[];
}

export interface UiSceneParityRefusal {
  readonly target: 'terminal' | 'browser';
  readonly message: string;
}

export interface UiSceneParityRefused {
  readonly witnessVersion: UiSceneParityVersion;
  readonly status: 'refused';
  /** The terminal refusal comes first when both targets refuse. */
  readonly refusals: readonly UiSceneParityRefusal[];
}

export type UiSceneParityWitness =
  | UiSceneParityComparison
  | UiSceneParityRefused;
