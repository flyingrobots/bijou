import type { BijouContext } from '../../ports/context.js';

/**
 * Inline (reading) direction of a component's layout: `'ltr'` (left to right)
 * or `'rtl'` (right to left). Distinct from split-layout `LayoutDirection`
 * (`row`/`column`). Map the i18n runtime's `'auto'` to `'ltr'` before passing it.
 */
export type InlineDirection = 'ltr' | 'rtl';

/** Logical inline edge: `'start'` is where reading begins, `'end'` where it ends. */
export type LogicalSide = 'start' | 'end';

/** Physical side a logical edge lands on for a given direction. */
export type PhysicalSide = 'left' | 'right';

/**
 * The direction inputs a component reads: an explicit option and the render
 * context. Component option types extend this through `BijouNodeOptions`.
 */
export interface DirectionInput {
  /** Explicit direction for this component. Overrides the context direction. */
  readonly direction?: InlineDirection | undefined;
  /** Render context; its `direction` applies when no explicit option is given. */
  readonly ctx?: BijouContext | undefined;
}

/**
 * Resolve the logical layout direction for one component render.
 *
 * Precedence: the explicit `direction` option, then `ctx.direction`, then
 * `'ltr'`. Pass the component options object directly; pass the resolved
 * context as `ctx` when the component fell back to the default context.
 */
export function resolveDirection(input: DirectionInput = {}): InlineDirection {
  return input.direction ?? input.ctx?.direction ?? 'ltr';
}

/**
 * Whether a component should mirror its visual layout.
 *
 * True only for a resolved `'rtl'` direction in `interactive` or `static`
 * output. `pipe` and `accessible` output keep logical order so parsers and
 * screen readers read top to bottom, start to end.
 */
export function mirrorsLayout(input: DirectionInput = {}): boolean {
  if (resolveDirection(input) !== 'rtl') return false;
  const mode = input.ctx?.mode;
  return mode !== 'pipe' && mode !== 'accessible';
}

/** Map a logical edge (`start`/`end`) to the physical side for `direction`. */
export function directionalSide(side: LogicalSide, direction: InlineDirection): PhysicalSide {
  const startsLeft = direction === 'ltr';
  return (side === 'start') === startsLeft ? 'left' : 'right';
}

/**
 * Return items in visual order for `direction`: unchanged for `'ltr'`,
 * reversed for `'rtl'`. Always returns a new array; the logical sequence is
 * never mutated, so current-item and index semantics stay logical.
 */
export function orderForDirection<T>(items: readonly T[], direction: InlineDirection): T[] {
  return direction === 'rtl' ? [...items].reverse() : [...items];
}
