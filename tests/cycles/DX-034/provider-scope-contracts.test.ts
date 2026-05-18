import { describe, expect, it } from 'vitest';
import {
  defineDataProvider,
  defineDataRequirement,
  provide,
  providerScope,
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
});
