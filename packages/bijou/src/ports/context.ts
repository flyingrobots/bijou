import type { ResolvedTheme } from '../core/theme/resolve.js';
import type { Theme, TokenValue, GradientStop } from '../core/theme/tokens.js';
import type { OutputMode } from '../core/detect/tty.js';
import type { RuntimePort } from './runtime.js';
import type { IOPort } from './io.js';
import type { StylePort } from './style.js';
import type { TokenGraph } from '../core/theme/graph.js';

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
  /** Reactive and Semantic Token Graph for advanced theming. */
  readonly tokenGraph: TokenGraph;

  /** Resolve styles from a global stylesheet based on component identity. */
  resolveBCSS(identity: { type: string, id?: string, classes?: string[] }): Record<string, string>;

  /** Look up a semantic color token. */
  semantic(key: keyof Theme['semantic']): TokenValue;
  /** Look up a border color token. */
  border(key: keyof Theme['border']): TokenValue;
  /** Look up a surface color token. */
  surface(key: keyof Theme['surface']): TokenValue;
  /** Look up a status color token with fallback to 'muted'. */
  status(key: string): TokenValue;
  /** Look up a UI element color token. */
  ui(key: string): TokenValue;
  /** Look up a gradient by key, returning its color stops. */
  gradient(key: string): GradientStop[];
}
