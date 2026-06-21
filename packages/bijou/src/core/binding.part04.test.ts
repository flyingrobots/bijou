import { describe, expect, it } from 'vitest';
import { defineDataRequirement, defineDataProvider, provide, providerScope, resolveProviderRequirement, resolveProviderRequirements } from './binding.js';

function m(target: object | undefined, key: PropertyKey, value: unknown): void {
  if (target === undefined) throw new Error('missing mutation target');
  Object.defineProperty(target, key, { value });
}

function c(target: unknown, args: readonly unknown[]): true {
  if (typeof target !== 'function') throw new Error('target is not callable');
  Reflect.apply(target, undefined, args);
  return true;
}

describe('binding primitives', () => {
  it('keeps provider scopes local and rejects ambiguous or loose provider entries', () => {
      const articleProvider = defineDataProvider({
        id: 'docs.articleProvider',
        resource: 'docs.article',
      });
      const replacementArticleProvider = defineDataProvider({
        id: 'docs.replacementArticleProvider',
        resource: 'docs.article',
      });
      const duplicateIdProvider = defineDataProvider({
        id: 'docs.articleProvider',
        resource: 'docs.article.v2',
      });
      const selectionProvider = defineDataProvider({
        id: 'docs.selectionProvider',
        resource: 'docs.selection',
      });
      const articleScope = providerScope([provide(articleProvider)]);
      const selectionScope = providerScope([provide(selectionProvider)]);

      expect(articleScope.has('docs.article')).toBe(true);
      expect(articleScope.has('docs.selection')).toBe(false);
      expect(selectionScope.has('docs.selection')).toBe(true);
      expect(selectionScope.has('docs.article')).toBe(false);
      expect(() => providerScope([
        provide(articleProvider),
        provide(replacementArticleProvider),
      ])).toThrow('provider scope: duplicate resource docs.article');
      expect(() => providerScope([
        provide(articleProvider),
        provide(duplicateIdProvider),
      ])).toThrow('provider scope: duplicate provider id docs.articleProvider');
      expect(() => c(provide, [{
        id: 'docs.looseProvider',
        resource: 'docs.article',
        facts: [],
      }])).toThrow(/defineDataProvider/);
      expect(() => c(providerScope, [[{
        resource: articleProvider.resource,
        provider: articleProvider,
      }]])).toThrow(/provide/);
    });

  it('resolves data requirements against an explicit provider scope', () => {
      const article = defineDataRequirement({
        id: ' article ',
        resource: ' docs.article ',
      });
      const comments = defineDataRequirement({
        id: 'comments',
        resource: 'docs.comments',
        optional: true,
      });
      const articleProvider = defineDataProvider({
        id: 'docs.articleProvider',
        resource: 'docs.article',
      });
      const scope = providerScope([provide(articleProvider)], { id: 'docs.appShell' });
      const resolved = resolveProviderRequirement(article, scope);
      const optionalMissing = resolveProviderRequirement(comments, scope);
      const all = resolveProviderRequirements([article, comments], scope);

      expect(resolved.status).toBe('resolved');
      expect(resolved.requirementId).toBe('article');
      expect(resolved.resource).toBe('docs.article');
      expect(resolved.providerId).toBe('docs.articleProvider');
      expect(resolved.scopeId).toBe('docs.appShell');
      expect(resolved.issues).toEqual([]);
      expect(Object.isFrozen(resolved)).toBe(true);
      expect(Object.isFrozen(resolved.issues)).toBe(true);
      expect(optionalMissing.status).toBe('missing-optional');
      expect(optionalMissing.providerId).toBeUndefined();
      expect(optionalMissing.issues).toEqual([]);
      expect(all.map((resolution) => resolution.status)).toEqual(['resolved', 'missing-optional']);
      expect(Object.isFrozen(all)).toBe(true);
      expect('refresh' in resolved).toBe(false);
      expect('subscribe' in resolved).toBe(false);
      expect('snapshot' in resolved).toBe(false);
    });

  it('reports required provider misses as immutable resolution issues', () => {
      const article = defineDataRequirement({
        id: 'article',
        resource: 'docs.article',
      });
      const scope = providerScope([], { id: 'empty' });
      const missing = resolveProviderRequirement(article, scope);

      expect(missing.status).toBe('missing-required');
      expect(missing.providerId).toBeUndefined();
      expect(missing.issues).toEqual([
        {
          severity: 'error',
          code: 'provider.missing',
          message: 'No provider in scope empty satisfies resource docs.article',
          path: 'article',
        },
      ]);
      expect(Object.isFrozen(missing.issues)).toBe(true);
      expect(() => {
        m(missing.issues, '1', {
          severity: 'error',
          code: 'mutated',
          message: 'mutated',
        });
      }).toThrow(TypeError);
      expect(() => c(resolveProviderRequirement, [{
        id: 'article',
        resource: 'docs.article',
        facts: [],
      }, scope])).toThrow(/defineDataRequirement/);
    });
});
