import { describe, expect, it } from 'vitest';
import {
  createScriptTestContext,
  runScriptDeterministic as runScript,
} from '../../helpers/scripted.js';
import { createToastCompressedScriptContext } from '../../helpers/scripted-compressed-time.js';
import { createDocsApp } from '../../../examples/docs/app.js';

const KEY_DOWN = '\x1b[B';

const KEY_ENTER = '\r';

const KEY_F2 = '\x1bOQ';

const LANGUAGE_CYCLE_TEST_TIMEOUT_MS = 30_000;

const COMPRESSED_FRAME_BUDGET = 12;

const LANGUAGE_CYCLE_STEPS = [
  { key: KEY_F2 },
  { key: KEY_DOWN },
  { key: KEY_DOWN },
  { key: KEY_ENTER },
];

function frameText(frame?: { width: number; height: number; get(x: number, y: number): { char?: string } }) {
  if (!frame) throw new Error('missing frame');
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char ?? ' ';
    }
    text += '\n';
  }
  return text;
}

const runtime = { columns: 120, rows: 40 };

describe('LX-011 DOGFOOD locale ratchet', () => {
  it('settles the language cycle in a few frames and ends on the same frame as real-time ticking', async () => {
      const slowCtx = createScriptTestContext({ mode: 'interactive', runtime });
      const slow = await runScript(
        createDocsApp(slowCtx, { initialRoute: 'docs', locale: 'en' }),
        LANGUAGE_CYCLE_STEPS,
        { ctx: slowCtx },
      );
      const fastCtx = createToastCompressedScriptContext({ mode: 'interactive', runtime });
      const fast = await runScript(
        createDocsApp(fastCtx, { initialRoute: 'docs', locale: 'en' }),
        LANGUAGE_CYCLE_STEPS,
        { ctx: fastCtx },
      );
      expect(slow.frames.length).toBeGreaterThan(COMPRESSED_FRAME_BUDGET);
      expect(fast.frames.length).toBeLessThanOrEqual(COMPRESSED_FRAME_BUDGET);
      expect(frameText(fast.frames.at(-1))).toBe(frameText(slow.frames.at(-1)));
      expect(fast.model.docsModel.pageModels).toEqual(slow.model.docsModel.pageModels);
    }, LANGUAGE_CYCLE_TEST_TIMEOUT_MS);
});
