import { runScript } from '@flyingrobots/bijou-tui';
import { writeSurfaceGif } from '@flyingrobots/bijou-node';
import { app, ctx } from './main.ts';

export default async function record(): Promise<void> {
  const result = await runScript(app, [{ key: ' ' }, { key: ' ' }], { ctx });
  const frames = result.frames.map((frame) => {
    const next = frame.clone();
    for (let y = 1; y < next.height; y += 2) {
      for (let x = 0; x < next.width; x++) {
        const cell = next.get(x, y);
        if (cell.empty) continue;
        const modifiers = new Set(cell.modifiers ?? []);
        modifiers.add('dim');
        next.set(x, y, { ...cell, modifiers: Array.from(modifiers) });
      }
    }
    return next;
  });

  writeSurfaceGif({
    outputPath: new URL('./demo.gif', import.meta.url).pathname,
    frames,
    frameDelayMs: 90,
  });
}
