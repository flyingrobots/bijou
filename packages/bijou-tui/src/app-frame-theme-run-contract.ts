import type { BijouContext } from '@flyingrobots/bijou';
import type { ResolvedFrameShellTheme } from './app-frame-overlays.js';

export interface FrameThemeRunSnapshot {
  readonly frameContext: BijouContext | undefined;
  readonly frameContextThemeId: string | undefined;
  readonly defaultContext: BijouContext | undefined;
  readonly resolvedThemes: readonly ResolvedFrameShellTheme[];
}
