import type { ResolvedTheme } from '../core/theme/resolve.js';
import type { OutputMode } from '../core/detect/tty.js';
import type { RuntimePort } from './runtime.js';
import type { IOPort } from './io.js';
import type { StylePort } from './style.js';

export interface BijouContext {
  readonly theme: ResolvedTheme;
  readonly mode: OutputMode;
  readonly runtime: RuntimePort;
  readonly io: IOPort;
  readonly style: StylePort;
}
