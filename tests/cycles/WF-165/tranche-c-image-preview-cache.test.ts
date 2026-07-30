import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scopedNodeIO } from '@flyingrobots/bijou-node';
import { afterEach, describe, expect, it } from 'vitest';
import { loadImagePreview } from '../../../examples/image-viewer/image-viewer-load.js';
import {
  DEFAULT_IMAGE_TUNING,
  DEFAULT_IMAGE_VIEWPORT,
} from '../../../examples/image-viewer/image-viewer-options.js';

const scratchDirectories: string[] = [];

afterEach(() => {
  for (const directory of scratchDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('WF-165 image preview cache', () => {
  it('reuses identical decodes and invalidates changed source bytes', () => {
    const root = mkdtempSync(join(tmpdir(), 'bijou-image-preview-'));
    scratchDirectories.push(root);
    const path = join(root, 'sample.ppm');
    const io = scopedNodeIO({ root });
    writeFileSync(path, 'P3\n1 1\n255\n255 0 0\n');

    const first = loadImagePreview(
      path,
      4,
      2,
      'ascii',
      DEFAULT_IMAGE_VIEWPORT,
      DEFAULT_IMAGE_TUNING,
      io,
    );
    const repeated = loadImagePreview(
      path,
      4,
      2,
      'ascii',
      DEFAULT_IMAGE_VIEWPORT,
      DEFAULT_IMAGE_TUNING,
      io,
    );
    expect(first).not.toBeInstanceOf(Error);
    expect(repeated).toBe(first);

    writeFileSync(path, 'P3\n2 1\n255\n255 0 0 0 0 255\n');
    const changed = loadImagePreview(
      path,
      4,
      2,
      'ascii',
      DEFAULT_IMAGE_VIEWPORT,
      DEFAULT_IMAGE_TUNING,
      io,
    );
    expect(changed).not.toBe(first);
    expect(changed).not.toBeInstanceOf(Error);
    if (!(changed instanceof Error)) expect(changed.width).toBe(2);
  });
});
