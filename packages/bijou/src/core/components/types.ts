import type { BijouContext } from '../../ports/context.js';
import type { InlineDirection } from '../direction/direction.js';

/** Shared overflow policy for text-bearing components. */
export type OverflowBehavior = 'wrap' | 'truncate';

/**
 * Base options shared by all Bijou UI components.
 * 
 * Part of the Standardized BijouNode Protocol.
 */
export interface BijouNodeOptions {
  /** Unique identifier for the component. Used for CSS styling (#id) and layout tracking. */
  readonly id?: string | undefined;
  /** CSS class name(s) for the component. Space-separated. */
  readonly class?: string | undefined;
  /** Optional Bijou context. If omitted, the global default context is used. */
  readonly ctx?: BijouContext | undefined;
  /** Horizontal overflow behavior for constrained text content. Defaults to `'wrap'`. */
  readonly overflow?: OverflowBehavior | undefined;
  /**
   * Logical layout direction. Overrides `ctx.direction`; absent both, `'ltr'`.
   * Direction-sensitive components read it through `resolveDirection()`.
   */
  readonly direction?: InlineDirection | undefined;
}
