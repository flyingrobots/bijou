import { describe, expect, it } from 'vitest';
import {
  bindingFrameFromSnapshots,
  bindingSnapshot,
  defineDataProvider,
  defineDataRequirement,
  provide,
  providerScope,
  resolveProviderRequirement,
} from '../../../packages/bijou/src/index.js';

describe('DX-034B provider scope contracts', () => {
  it('keeps provider availability explicit, local, and inspectable', () => {
    const article = defineDataRequirement({
      id: 'article',
      resource: 'docs.article',
    });
    const articleProvider = defineDataProvider({
      id: 'docs.articleProvider',
      resource: article.resource,
    });
    const scope = providerScope([provide(articleProvider)], { id: 'docs.appShell' });
    const emptyScope = providerScope([], { id: 'empty' });

    expect(scope.id).toBe('docs.appShell');
    expect(scope.has(article.resource)).toBe(true);
    expect(scope.get(article.resource)?.id).toBe('docs.articleProvider');
    expect(scope.resources()).toEqual(['docs.article']);
    expect(emptyScope.has(article.resource)).toBe(false);
    expect('refresh' in articleProvider).toBe(false);
    expect('subscribe' in articleProvider).toBe(false);
    expect('provider' in emptyScope).toBe(false);
  });

  it('resolves requirements without consulting global provider state', () => {
    const article = defineDataRequirement({
      id: 'article',
      resource: 'docs.article',
    });
    const articleProvider = defineDataProvider({
      id: 'docs.articleProvider',
      resource: article.resource,
    });
    const populatedScope = providerScope([provide(articleProvider)], { id: 'populated' });
    const emptyScope = providerScope([], { id: 'empty' });

    expect(resolveProviderRequirement(article, populatedScope).status).toBe('resolved');
    expect(resolveProviderRequirement(article, populatedScope).providerId).toBe(
      'docs.articleProvider',
    );
    expect(resolveProviderRequirement(article, emptyScope).status).toBe('missing-required');
  });

  it('assembles render frames from resolved provider snapshots without provider handles', () => {
    const article = defineDataRequirement({
      id: 'article',
      resource: 'docs.article',
    });
    const articleProvider = defineDataProvider({
      id: 'docs.articleProvider',
      resource: article.resource,
    });
    const scope = providerScope([provide(articleProvider)], { id: 'populated' });
    const resolution = resolveProviderRequirement(article, scope);
    const assembled = bindingFrameFromSnapshots({
      resolutions: [resolution],
      snapshots: [
        bindingSnapshot({
          providerId: 'docs.articleProvider',
          requirementId: 'article',
          version: 1,
          status: 'ready',
          data: { title: 'DX-034' },
        }),
      ],
    });

    expect(assembled.frame.require<{ title: string }>('article')).toEqual({
      title: 'DX-034',
    });
    expect(assembled.issues).toEqual([]);
    expect('provider' in assembled.frame).toBe(false);
    expect('refresh' in assembled).toBe(false);
  });
});
