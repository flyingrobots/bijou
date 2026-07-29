import { runScript } from '@flyingrobots/bijou-tui';
import type { NativeDemoSpec, RecorderResult } from './recorder.part01.js';
import { writeSurfaceGif } from './recorder.part03.js';

export async function recordDemoGif<Model, M = never>(
  spec: NativeDemoSpec<Model, M>,
): Promise<RecorderResult> {
  const result = await runScript(spec.app, spec.steps, {
    ctx: spec.ctx,
    css: spec.css,
  });

  return writeSurfaceGif({
    outputPath: spec.outputPath,
    frames: result.frames,
    frameDelayMs: spec.frameDelayMs,
    cellWidth: spec.cellWidth,
    cellHeight: spec.cellHeight,
    foreground: spec.foreground,
    background: spec.background,
  });
}
