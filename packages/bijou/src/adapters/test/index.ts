/**
 * Test adapters for bijou's hexagonal ports.
 *
 * Re-exports mock/stub implementations of {@link RuntimePort}, {@link IOPort},
 * and {@link StylePort} along with the {@link createTestContext} convenience
 * factory that assembles them into a complete {@link BijouContext}.
 *
 * @module
 */
import type { BijouContext } from '../../ports/context.js';
import type { OutputMode } from '../../core/detect/tty.js';
import { mockRuntime, type MockRuntimeOptions } from './runtime.js';
import { mockIO, type MockIOOptions, type MockIO } from './io.js';
import { plainStyle } from './style.js';
import { createResolved } from '../../core/theme/resolve.js';
import { CYAN_MAGENTA } from '../../core/theme/presets.js';
import type { Theme } from '../../core/theme/tokens.js';

export { mockRuntime, type MockRuntimeOptions } from './runtime.js';
export { mockIO, type MockIOOptions, type MockIO } from './io.js';
export { plainStyle } from './style.js';
export { auditStyle, type StyledCall, type AuditStylePort } from './audit-style.js';

/**
 * Configuration for {@link createTestContext}.
 */
export interface TestContextOptions {
  /** Overrides for the mock runtime (env vars, terminal dimensions). */
  runtime?: MockRuntimeOptions;
  /** Overrides for mock I/O (pre-loaded answers, keys, virtual files). */
  io?: MockIOOptions;
  /** Theme to resolve. Defaults to `CYAN_MAGENTA`. */
  theme?: Theme;
  /** Output mode. Defaults to `'interactive'`. */
  mode?: OutputMode;
  /** Whether to strip color from the resolved theme. Defaults to `false`. */
  noColor?: boolean;
}

/**
 * A {@link BijouContext} whose `io` property is narrowed to {@link MockIO},
 * exposing test-inspection helpers such as `written` and `answerQueue`.
 */
export interface TestContext extends BijouContext {
  /** Mock I/O adapter with inspectable internal buffers. */
  readonly io: MockIO;
}

/**
 * Create a fully-wired {@link BijouContext} for unit and integration tests.
 *
 * Assemble a {@link mockRuntime}, {@link mockIO}, and {@link plainStyle}
 * together with a resolved theme so tests can exercise bijou components
 * without touching real terminals or filesystems.
 *
 * @param options - Optional overrides for runtime, I/O, theme, mode, and color.
 * @returns A {@link TestContext} ready for use in tests.
 */
export function createTestContext(options: TestContextOptions = {}): TestContext {
  const runtime = mockRuntime(options.runtime);
  const io = mockIO(options.io);
  const style = plainStyle();
  const theme = createResolved(options.theme ?? CYAN_MAGENTA, options.noColor ?? false);
  const mode: OutputMode = options.mode ?? 'interactive';

  return { theme, mode, runtime, io, style };
}
