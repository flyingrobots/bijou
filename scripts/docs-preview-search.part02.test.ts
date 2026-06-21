
import {
  afterEach,
  createDocsApp,
  createTestContext,
  describe,
  docsPageModel,
  expect,
  frameText,
  it,
  KEY_ENTER,
  KEY_NEXT_TAB,
  runScript,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('can open the new confirm story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);
    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 'c' },
      { key: 'o' },
      { key: 'n' },
      { key: 'f' },
      { key: 'i' },
      { key: 'r' },
      { key: 'm' },
      { key: KEY_ENTER },
    ], { ctx });
    const pageModel = docsPageModel(result.model, 'components');
    const text = frameText(must(result.frames[result.frames.length - 1]));
    expect(pageModel.selectedStoryId).toBe('confirm');
    expect(text).toContain('confirm()');
    expect(text).toContain('Deploy to production?');
    expect(text).toContain('Default');
    expect(text).toContain('No');
  });
});

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('can open the new tabs story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);
    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 't' },
      { key: 'a' },
      { key: 'b' },
      { key: 's' },
      { key: KEY_ENTER },
    ], { ctx });
    const pageModel = docsPageModel(result.model, 'components');
    const text = frameText(must(result.frames[result.frames.length - 1]));
    expect(pageModel.selectedStoryId).toBe('tabs');
    expect(text).toContain('tabs()');
    expect(text).toContain('Current pane');
    expect(text).toContain('Rollout');
  });
});

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('can open the new group and wizard story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);
    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 'w' },
      { key: 'i' },
      { key: 'z' },
      { key: KEY_ENTER },
      { key: '.' },
    ], { ctx });
    const pageModel = docsPageModel(result.model, 'components');
    const text = frameText(must(result.frames[result.frames.length - 1]));
    expect(pageModel.selectedStoryId).toBe('group-wizard');
    expect(text).toContain('group() / wizard()');
    expect(text).toContain('Step 2 of 3');
    expect(text).toContain('Verification');
  });
});

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('can open the new explainability story directly from component search', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);
    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: '/' },
      { key: 'e' },
      { key: 'x' },
      { key: 'p' },
      { key: 'l' },
      { key: 'a' },
      { key: 'i' },
      { key: 'n' },
      { key: KEY_ENTER },
    ], { ctx });
    const pageModel = docsPageModel(result.model, 'components');
    const text = frameText(must(result.frames[result.frames.length - 1]));
    expect(pageModel.selectedStoryId).toBe('explainability');
    expect(text).toContain('explainability()');
    expect(text).toContain('[AI]');
    expect(text).toContain('Evidence');
    expect(text).toContain('Promote the canary build');
  });
});
