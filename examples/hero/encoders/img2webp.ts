import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { encodePng } from '../png.js';
import { holdRuns, type AnimationEncoder } from './port.js';

/**
 * Full-colour animated WebP through img2webp (`brew install webp`), lossy at quality 90. Runs of identical frames
 * become one PNG held for the run; img2webp assembles them on close.
 */
export const IMG2WEBP: AnimationEncoder = {
  name: 'img2webp (animated WebP)',
  extensions: ['.webp'],
  open(out, { width, height, delayCs }) {
    const dir = mkdtempSync(join(tmpdir(), 'bijou-webp-'));
    const args = ['-loop', '0', '-lossy', '-q', '90', '-m', '4'];
    let index = 0;
    const runs = holdRuns((rgba, count) => {
      const file = join(dir, `${String(index++).padStart(6, '0')}.png`);
      writeFileSync(file, encodePng(rgba, width, height));
      args.push('-d', String(delayCs * 10 * count), file);
    });
    return {
      add(rgba) { runs.add(rgba); return Promise.resolve(); },
      close() {
        try {
          runs.flush();
          mkdirSync(dirname(out), { recursive: true });
          const result = spawnSync('img2webp', [...args, '-o', out], { encoding: 'utf8' });
          if (result.error !== undefined) throw new Error(`img2webp could not run (install it with: brew install webp): ${result.error.message}`);
          if (result.status !== 0) throw new Error(`img2webp failed: ${result.stderr}`);
        } finally {
          rmSync(dir, { recursive: true, force: true });
        }
        return Promise.resolve();
      },
    };
  },
};
