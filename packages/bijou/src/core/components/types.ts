import type { BijouContext } from '../../ports/context.js';

/** Shared overflow policy for text-bearing components. */
export type OverflowBehavior = 'wrap' | 'truncate';

/**
 * Base options shared by all Bijou UI components.
 * 
 * Part of the Standardized BijouNode Protocol.
 */
export interface BijouNodeOptions {
  /** Unique identifier for the component. Used for CSS styling (#id) and layout tracking. */
  id?: string;
  /** CSS class name(s) for the component. Space-separated. */
  class?: string;
  /** Optional Bijou context. If omitted, the global default context is used. */
  ctx?: BijouContext;
  /** Horizontal overflow behavior for constrained text content. Defaults to `'wrap'`. */
  overflow?: OverflowBehavior;
}
