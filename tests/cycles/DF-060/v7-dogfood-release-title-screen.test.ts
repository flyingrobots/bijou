import { describe, expect, it } from 'vitest';
import {
  CURRENT_DOGFOOD_RELEASE_TITLE,
  dogfoodReleaseTitleFacts,
  DOGFOOD_RELEASE_TITLE_GALLERY,
  renderDogfoodReleaseTitleText,
  V7_LAUNCH_DOGFOOD_RELEASE_TITLE,
  V7_DOGFOOD_RELEASE_TITLE,
} from '../../../examples/docs/release-title.js';
import { must } from '@flyingrobots/bijou/adapters/test';
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
    expect(renderDogfoodReleaseTitleText({
      release: V7_DOGFOOD_RELEASE_TITLE,
      mode: 'pipe',
      width: 80,
    })).toContain('release_id\tv7');
    expect(renderDogfoodReleaseTitleText({
      release: V7_DOGFOOD_RELEASE_TITLE,
      mode: 'pipe',
      width: 80,
    })).toContain('proof_lane\tBlockLab');
    expect(renderDogfoodReleaseTitleText({ mode: 'accessible', width: 80 })).toContain(
      'Navigation remains available after the title.',
    );
  });

  it('publishes a latest-first release-title gallery with a unique post-release treatment', () => {
    expect(CURRENT_DOGFOOD_RELEASE_TITLE).toBe(V7_LAUNCH_DOGFOOD_RELEASE_TITLE);
    expect(DOGFOOD_RELEASE_TITLE_GALLERY.map((release) => release.id)).toEqual([
      'v7-launch',
      'v7',
    ]);
    expect(V7_LAUNCH_DOGFOOD_RELEASE_TITLE.title).toBe('V7 Launch Wake');
    expect(V7_LAUNCH_DOGFOOD_RELEASE_TITLE.motif).toContain('Wake lines');
    expect(dogfoodReleaseTitleFacts(V7_LAUNCH_DOGFOOD_RELEASE_TITLE)).toContainEqual({
      key: 'release_motif',
      value: 'Wake lines, not fireworks: proof remains visible after ship.',
    });
    expect(renderDogfoodReleaseTitleText({
      release: V7_LAUNCH_DOGFOOD_RELEASE_TITLE,
      mode: 'pipe',
      width: 80,
    })).toContain('release_id\tv7-launch');
  });

  it('keeps interactive release-title output within the requested width', () => {
    const output = renderDogfoodReleaseTitleText({
      release: V7_LAUNCH_DOGFOOD_RELEASE_TITLE,
      mode: 'interactive',
      width: 42,
    });
    const lineWidths = output.split('\n').map((line) => line.length);

    expect(lineWidths.every((width) => width <= 42)).toBe(true);
    expect(output).toContain('V7 Launch Wake');
  });

  it('renders the post-release title as the first DOGFOOD Release guide', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 42 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'release' });
    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'select-guide', guideId: 'release-title-v7-launch' },
      },
    }], { ctx });
    const text = frameText(must(result.frames.at(-1)));
    const releaseModel = (result.model as any).docsModel.pageModels.release;

    expect(releaseModel.guideState.items[0].value).toBe('release-title-v7-launch');
    expect(releaseModel.guideState.items[1].value).toBe('release-title-v7');
    expect(releaseModel.selectedGuideId).toBe('release-title-v7-launch');
    expect(text).toContain('V7 Launch Wake');
    expect(text).toContain('A released line leaves a readable trail.');
    expect(text).toContain('published release');
    expect(text).toContain('title gallery');
    expect(text).toContain('Release Notes');
    expect(text).not.toContain('Press [Enter]');
  });

  it('keeps the original v7 title selectable as a historical Release guide', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 42 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'release' });
    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'select-guide', guideId: 'release-title-v7' },
      },
    }], { ctx });
    const text = frameText(must(result.frames.at(-1)));
    const releaseModel = (result.model as any).docsModel.pageModels.release;

    expect(releaseModel.selectedGuideId).toBe('release-title-v7');
    expect(text).toContain('V7 Product Truth');
    expect(text).toContain('Blocks prove product surfaces');
    expect(text).toContain('table parity');
    expect(text).toContain('BlockLab');
    expect(text).toContain('release_id  v7');
    expect(text).not.toContain('release_motif');
  });
});
