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

export interface TestContextOptions {
  runtime?: MockRuntimeOptions;
  io?: MockIOOptions;
  theme?: Theme;
  mode?: OutputMode;
  noColor?: boolean;
}

export interface TestContext extends BijouContext {
  readonly io: MockIO;
}

export function createTestContext(options: TestContextOptions = {}): TestContext {
  const runtime = mockRuntime(options.runtime);
  const io = mockIO(options.io);
  const style = plainStyle();
  const theme = createResolved(options.theme ?? CYAN_MAGENTA, options.noColor ?? false);
  const mode: OutputMode = options.mode ?? 'interactive';

  return { theme, mode, runtime, io, style };
}
