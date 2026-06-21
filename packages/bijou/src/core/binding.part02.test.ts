import { describe, expect, it } from 'vitest';
import { BindingFrame, bindingFrame, bindingSnapshot, type BindingStatus } from './binding.js';

interface Article { title: string; tags: string[]; meta: { draft: boolean }; }

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
  it('rejects executable accessors and hidden property channels as snapshot data', () => {
      const base = {
        providerId: 'docs.articleProvider',
        requirementId: 'article',
        version: 1,
        status: 'ready' as const,
      };
      let getterWasCalled = false;
      const accessorData = {};
      Object.defineProperty(accessorData, 'title', {
        enumerable: true,
        get() {
          getterWasCalled = true;
          return 'DX-034';
        },
      });
      const hiddenData = {};
      Object.defineProperty(hiddenData, 'title', {
        enumerable: false,
        value: 'DX-034',
      });
      const secretKey = Symbol('secret');

      expect(() => bindingSnapshot({
        ...base,
        data: accessorData,
      })).toThrow('binding data: unsupported accessor at data.title');
      expect(getterWasCalled).toBe(false);
      expect(() => bindingSnapshot({
        ...base,
        data: hiddenData,
      })).toThrow('binding data: unsupported non-enumerable property at data.title');
      expect(() => bindingSnapshot({
        ...base,
        data: { [secretKey]: 'DX-034' },
      })).toThrow('binding data: unsupported symbol property at data');
    });

  it('rejects invalid snapshot ids, versions, and statuses', () => {
      expect(() => bindingSnapshot({
        providerId: '',
        requirementId: 'article',
        version: 1,
        status: 'ready',
      })).toThrow('binding snapshot: providerId is required');

      expect(() => bindingSnapshot({
        providerId: 'docs.articleProvider',
        requirementId: '   ',
        version: 1,
        status: 'ready',
      })).toThrow('binding snapshot: requirementId is required');

      expect(() => bindingSnapshot({
        providerId: 'docs.articleProvider',
        requirementId: 'article',
        version: 0,
        status: 'ready',
      })).toThrow('binding snapshot: version must be a positive integer');

      expect(() => c(bindingSnapshot, [{
        providerId: 'docs.articleProvider',
        requirementId: 'article',
        version: 1,
        status: 'loaded',
      }])).toThrow('binding snapshot: unsupported status loaded');
    });

  it('creates binding frames with read-only require, get, status, and issues accessors', () => {
      const article = bindingSnapshot<Article>({
        providerId: 'docs.articleProvider',
        requirementId: 'article',
        version: 1,
        status: 'ready',
        data: {
          title: 'DX-034',
          tags: ['binding'],
          meta: { draft: false },
        },
      });
      const comments = bindingSnapshot({
        providerId: 'docs.commentsProvider',
        requirementId: 'comments',
        version: 1,
        status: 'loading',
        issues: [{ severity: 'info', code: 'pending', message: 'comments are loading' }],
      });
      const frame = bindingFrame([article, comments]);

      expect(frame).toBeInstanceOf(BindingFrame);
      expect(frame.ids()).toEqual(['article', 'comments']);
      expect(frame.require<Article>('article').title).toBe('DX-034');
      expect(frame.get<Article>('article')?.tags).toEqual(['binding']);
      expect(frame.get('comments')).toBeUndefined();
      expect(frame.get('missing')).toBeUndefined();
      expect(frame.status('article')).toBe('ready');
      expect(frame.status('comments')).toBe('loading');
      expect(frame.status('missing')).toBeUndefined();
      expect(frame.issues('comments')).toEqual([
        { severity: 'info', code: 'pending', message: 'comments are loading' },
      ]);
      expect(Object.isFrozen(frame.issues('comments'))).toBe(true);
      expect(() => frame.require('comments')).toThrow(
        'binding frame: requirement comments is loading',
      );
      expect(() => frame.require('missing')).toThrow(
        'binding frame: missing requirement missing',
      );
      expect(() => {
        m(frame.require<Article>('article'), 'title', 'mutated');
      }).toThrow(TypeError);
    });

  it('reports every known binding status through a frame', () => {
      const statuses: readonly BindingStatus[] = ['ready', 'loading', 'empty', 'stale', 'error'];
      const frame = bindingFrame(statuses.map((status, index) => bindingSnapshot({
        providerId: `provider.${status}`,
        requirementId: status,
        version: index + 1,
        status,
        data: status === 'ready' ? { status } : undefined,
      })));

      expect(statuses.map((status) => frame.status(status))).toEqual(statuses);
    });
});
