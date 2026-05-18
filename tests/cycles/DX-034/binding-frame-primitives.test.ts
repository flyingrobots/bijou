import { describe, expect, it } from 'vitest';
import {
  bindingFrame,
  bindingSnapshot,
  commandIntent,
  defineDataRequirement,
} from '../../../packages/bijou/src/index.js';

describe('DX-034A binding snapshot and frame primitives', () => {
  it('lets a view read immutable provider snapshots through the public frame API', () => {
    const article = defineDataRequirement({
      id: 'article',
      resource: 'docs.article',
    });
    const snapshot = bindingSnapshot({
      providerId: 'docs.articleProvider',
      requirementId: article.id,
      version: 1,
      status: 'ready',
      data: { title: 'DX-034' },
    });
    const frame = bindingFrame([snapshot]);
    const intent = commandIntent<{ articleId: string }>('docs.openArticle');

    expect(frame.require<{ title: string }>('article')).toEqual({ title: 'DX-034' });
    expect(frame.status('article')).toBe('ready');
    expect(Object.isFrozen(frame.require('article'))).toBe(true);
    expect(intent.id).toBe('docs.openArticle');
    expect('execute' in intent).toBe(false);
    expect('provider' in frame).toBe(false);
  });

  it('models provider updates as replacement frames through the public API', () => {
    const firstFrame = bindingFrame([
      bindingSnapshot({
        providerId: 'docs.articleProvider',
        requirementId: 'article',
        version: 1,
        status: 'ready',
        data: { title: 'First' },
      }),
    ]);
    const nextFrame = bindingFrame([
      bindingSnapshot({
        providerId: 'docs.articleProvider',
        requirementId: 'article',
        version: 2,
        status: 'ready',
        data: { title: 'Second' },
      }),
    ]);

    expect(firstFrame.require<{ title: string }>('article')).toEqual({ title: 'First' });
    expect(firstFrame.snapshot('article')?.version).toBe(1);
    expect(nextFrame.require<{ title: string }>('article')).toEqual({ title: 'Second' });
    expect(nextFrame.snapshot('article')?.version).toBe(2);
  });
});
