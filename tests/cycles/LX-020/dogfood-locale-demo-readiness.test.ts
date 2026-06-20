import { describe, expect, it } from 'vitest';
import {
  createScriptTestContext as createTestContext,
  runScriptDeterministic as runScript,
} from '../../helpers/scripted.js';
import { must } from '@flyingrobots/bijou/adapters/test';
import { createDocsApp } from '../../../examples/docs/app.js';

const MISSING_MARKER = '<MISSING LOC STRING KEY=';

function frameText(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }): string {
  let text = '';
  for (let y = 0; y < frame.height; y += 1) {
    for (let x = 0; x < frame.width; x += 1) {
      text += frame.get(x, y).char ?? ' ';
    }
    text += '\n';
  }
  return text;
}

describe('LX-020 DOGFOOD locale demo readiness', () => {
  it('renders the French Blocks release-demo path without visible missing localization markers', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      initialPageId: 'blocks',
      locale: 'fr',
    });

    const result = await runScript(app, [], { ctx });
    const text = frameText(must(result.frames.at(-1)));

    expect(text).toContain('CounterDemoBlock');
    expect(text).not.toContain(MISSING_MARKER);
  });

  it('labels English-source documentation when a non-English locale is selected', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 140, rows: 50 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      initialPageId: 'guides',
      locale: 'fr',
    });

    const result = await runScript(app, [
      { msg: { type: 'docs', msg: { type: 'select-guide', guideId: 'start-here' } } },
    ], { ctx });
    const text = frameText(must(result.frames.at(-1)));

    expect(text).toContain('Documentation source en anglais');
    expect(text).toContain('Start Here');
    expect(text).not.toContain(MISSING_MARKER);
  });
});
