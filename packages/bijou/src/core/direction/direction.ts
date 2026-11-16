import type { BijouContext } from '../../ports/context.js';

/** Logical layout direction: `'ltr'` (left to right) or `'rtl'` (right to left). */
export type LayoutDirection = 'ltr' | 'rtl';

/** Logical inline edge: `'start'` is where reading begins, `'end'` where it ends. */
export type LogicalSide = 'start' | 'end';

/** Physical side a logical edge lands on for a given direction. */
export type PhysicalSide = 'left' | 'right';

/** The direction inputs a component reads: an explicit option and the render context. */
export interface DirectionInput {
  /** Explicit direction for this component. Overrides the context direction. */
  readonly direction?: LayoutDirection | undefined;
  /** Render context; its `direction` applies when no explicit option is given. */
  readonly ctx?: BijouContext | undefined;
}

export function resolveDirection(input: DirectionInput = {}): LayoutDirection {
  throw new Error(`not implemented: ${JSON.stringify(input.direction ?? null)}`);
}

export function mirrorsLayout(input: DirectionInput = {}): boolean {
  throw new Error(`not implemented: ${JSON.stringify(input.direction ?? null)}`);
}

export function directionalSide(side: LogicalSide, direction: LayoutDirection): PhysicalSide {
  throw new Error(`not implemented: ${JSON.stringify([side, direction])}`);
}

export function orderForDirection<T>(items: readonly T[], direction: LayoutDirection): T[] {
  throw new Error(`not implemented: ${JSON.stringify([items.length, direction])}`);
}
