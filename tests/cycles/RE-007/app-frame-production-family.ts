import { readdirSync } from 'node:fs';
import { repoPath, readRepoFile } from '../repo.js';

const APP_FRAME_SOURCE_ROOT = 'packages/bijou-tui/src';

export function readAppFrameProductionFamily(): string {
  return readdirSync(repoPath(APP_FRAME_SOURCE_ROOT), {
    withFileTypes: true,
  })
    .filter(
      (entry) =>
        entry.isFile() &&
        (entry.name === 'app-frame.ts' ||
          (entry.name.startsWith('app-frame-') &&
            entry.name.endsWith('.ts') &&
            !entry.name.endsWith('.test.ts'))),
    )
    .map((entry) => entry.name)
    .sort()
    .map((name) => readRepoFile(`${APP_FRAME_SOURCE_ROOT}/${name}`))
    .join('\n');
}
