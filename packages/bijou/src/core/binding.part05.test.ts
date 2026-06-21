import { describe, expect, it } from 'vitest';
import { bindingFrameFromSnapshots, bindingSnapshot, defineDataRequirement, defineDataProvider, provide, providerScope, resolveProviderRequirements } from './binding.js';

function c(target: unknown, args: readonly unknown[]): true {
  if (typeof target !== 'function') throw new Error('target is not callable');
  Reflect.apply(target, undefined, args);
  return true;
}

describe('binding primitives', () => {
  it('assembles binding frames from resolved provider snapshots', () => {
      const article = defineDataRequirement({
        id: 'article',
        resource: 'docs.article',
      });
      const comments = defineDataRequirement({
        id: 'comments',
        resource: 'docs.comments',
      });
      const outline = defineDataRequirement({
        id: 'outline',
        resource: 'docs.outline',
        optional: true,
      });
      const articleProvider = defineDataProvider({
        id: 'docs.articleProvider',
        resource: 'docs.article',
      });
      const commentsProvider = defineDataProvider({
        id: 'docs.commentsProvider',
        resource: 'docs.comments',
      });
      const scope = providerScope([
        provide(articleProvider),
        provide(commentsProvider),
      ]);
      const resolutions = resolveProviderRequirements([article, comments, outline], scope);
      const assembled = bindingFrameFromSnapshots({
        resolutions,
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

      expect(assembled.frame.require<{ title: string }>('article')).toEqual({ title: 'DX-034' });
      expect(assembled.issues).toEqual([
        {
          severity: 'error',
          code: 'snapshot.missing',
          message: 'No snapshot supplied for resolved requirement comments',
          path: 'comments',
        },
      ]);
      expect(assembled.facts).toEqual([]);
      expect(Object.isFrozen(assembled)).toBe(true);
      expect(Object.isFrozen(assembled.issues)).toBe(true);
      expect('provider' in assembled).toBe(false);
      expect('refresh' in assembled).toBe(false);
      expect('subscribe' in assembled).toBe(false);
    });

  it('rejects snapshots that do not match resolved provider metadata', () => {
      const article = defineDataRequirement({
        id: 'article',
        resource: 'docs.article',
      });
      const articleProvider = defineDataProvider({
        id: 'docs.articleProvider',
        resource: 'docs.article',
      });
      const scope = providerScope([provide(articleProvider)]);
      const resolutions = resolveProviderRequirements([article], scope);
      const wrongProvider = bindingFrameFromSnapshots({
        resolutions,
        snapshots: [
          bindingSnapshot({
            providerId: 'docs.otherProvider',
            requirementId: 'article',
            version: 1,
            status: 'ready',
            data: { title: 'Wrong provider' },
          }),
        ],
      });

      expect(wrongProvider.frame.get('article')).toBeUndefined();
      expect(wrongProvider.issues).toEqual([
        {
          severity: 'error',
          code: 'snapshot.provider-mismatch',
          message: 'Snapshot for requirement article came from provider docs.otherProvider; expected docs.articleProvider',
          path: 'article',
        },
      ]);
      expect(() => bindingFrameFromSnapshots({
        resolutions,
        snapshots: [
          bindingSnapshot({
            providerId: 'docs.articleProvider',
            requirementId: 'unknown',
            version: 1,
            status: 'ready',
            data: { title: 'Unknown' },
          }),
        ],
      })).toThrow('binding frame assembly: snapshot requirement unknown was not resolved');
      expect(() => c(bindingFrameFromSnapshots, [{
        resolutions: [{
          requirementId: 'article',
          resource: 'docs.article',
          optional: false,
          status: 'resolved',
          providerId: 'docs.articleProvider',
          issues: [],
          facts: [],
        }],
        snapshots: [],
      }])).toThrow(/resolveProviderRequirement/);
    });
});
