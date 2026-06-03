import { describe, expect, it } from 'vitest';
import {
  dogfoodReleaseTitleFacts,
  renderDogfoodReleaseTitleText,
  V7_DOGFOOD_RELEASE_TITLE,
} from '../../../examples/docs/release-title.js';
import { createDocsApp } from '../../../examples/docs/app.js';
import {
  createScriptTestContext as createTestContext,
  runScriptDeterministic as runScript,
} from '../../helpers/scripted.js';

function frameText(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }) {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char || ' ';
    }
    text += '\n';
  }
  return text;
}

describe('DF-060 v7 DOGFOOD release title screen', () => {
  it('publishes v7 release-title metadata and lower-mode facts', () => {
    expect(V7_DOGFOOD_RELEASE_TITLE.id).toBe('v7');
    expect(V7_DOGFOOD_RELEASE_TITLE.title).toBe('V7 Product Truth');
    expect(V7_DOGFOOD_RELEASE_TITLE.proofLanes.map((lane) => lane.id)).toEqual([
      'table-parity',
      'scoped-node-io',
      'blocklab',
      'release-title',
    ]);

    expect(dogfoodReleaseTitleFacts(V7_DOGFOOD_RELEASE_TITLE)).toContainEqual({
      key: 'release_id',
      value: 'v7',
    });
    expect(renderDogfoodReleaseTitleText({ mode: 'pipe', width: 80 })).toContain('release_id\tv7');
    expect(renderDogfoodReleaseTitleText({ mode: 'pipe', width: 80 })).toContain('proof_lane\tBlockLab');
    expect(renderDogfoodReleaseTitleText({ mode: 'accessible', width: 80 })).toContain(
      'Navigation remains available after the title.',
    );
  });

  it('keeps interactive release-title output within the requested width', () => {
    const output = renderDogfoodReleaseTitleText({ mode: 'interactive', width: 42 });
    const lineWidths = output.split('\n').map((line) => line.length);

    expect(lineWidths.every((width) => width <= 42)).toBe(true);
    expect(output).toContain('V7 Product Truth');
  });

  it('renders the v7 release title as the first DOGFOOD Release guide', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 42 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'release' as any });
    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'select-guide', guideId: 'release-title-v7' },
      },
    }], { ctx });
    const text = frameText(result.frames.at(-1)!);
    const releaseModel = (result.model as any).docsModel.pageModels.release;

    expect(releaseModel.guideState.items[0].value).toBe('release-title-v7');
    expect(releaseModel.selectedGuideId).toBe('release-title-v7');
    expect(text).toContain('V7 Product Truth');
    expect(text).toContain('Blocks prove product surfaces');
    expect(text).toContain('table parity');
    expect(text).toContain('scoped Node I/O');
    expect(text).toContain('BlockLab');
    expect(text).toContain('Release Notes');
    expect(text).not.toContain('Press [Enter]');
  });
});
