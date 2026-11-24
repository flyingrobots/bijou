import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderFrameText } from '../scripts/frame-assertions.js';
import { demos } from '../examples/fun/registry.js';
import { feed, frameScript, funContext, mountEntry } from './helpers/fun-demos.js';

const DIR = join(import.meta.dirname, 'fixtures', 'examples-fun', 'frames');

describe('the fun demos as readable text frames', () => {
  for (const entry of demos) {
    it(`${entry.id} at 80x24 matches tests/fixtures/examples-fun/frames/${entry.id}-80x24.txt`, () => {
      const ctx = funContext(80, 24);
      const frame = feed(mountEntry(entry), frameScript(entry.id, 80, 24)).view(80, 24, ctx);
      expect(renderFrameText(frame, ctx.style)).toBe(readFileSync(join(DIR, `${entry.id}-80x24.txt`), 'utf8'));
    });
  }
});
