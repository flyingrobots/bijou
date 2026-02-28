import type { ResolvedTheme } from '../core/theme/resolve.js';
import type { OutputMode } from '../core/detect/tty.js';
import type { RuntimePort } from './runtime.js';
import type { IOPort } from './io.js';
import type { StylePort } from './style.js';

/**
 * Top-level dependency-injection context threaded through every bijou component.
 *
 * Bundles the resolved theme, output mode, and all port adapters so that
 * components never reach for Node.js globals directly.
 */
export interface BijouContext {
  /** Fully-resolved theme with color tokens ready for rendering. */
  readonly theme: ResolvedTheme;
  /** Current output fidelity: `'interactive'`, `'static'`, `'pipe'`, or `'accessible'`. */
  readonly mode: OutputMode;
  /** Environment / terminal dimensions adapter. */
  readonly runtime: RuntimePort;
  /** I/O adapter (stdin/stdout, filesystem). */
  readonly io: IOPort;
  /** Color / text-decoration adapter. */
  readonly style: StylePort;
}
