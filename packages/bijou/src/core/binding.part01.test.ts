import { describe, expect, it } from 'vitest';
import { bindingSnapshot, defineDataRequirement, isBindingSnapshot } from './binding.js';

function m(target: object | undefined, key: PropertyKey, value: unknown): void {
  if (target === undefined) throw new Error('missing mutation target');
  Object.defineProperty(target, key, { value });
}

describe('binding primitives', () => {
  it('creates immutable runtime-backed ready snapshots', () => {
      const article = {
        title: 'DX-034',
        tags: ['binding'],
        meta: { draft: false },
      };
      const requirement = defineDataRequirement({
        id: ' article ',
        resource: ' docs.article ',
        facts: [{ kind: 'entity', key: 'resource', value: 'article' }],
      });
      const snapshot = bindingSnapshot({
        providerId: ' docs.articleProvider ',
        requirementId: requirement.id,
        version: 1,
        status: 'ready',
        data: article,
        issues: [{ severity: 'warning', code: 'freshness', message: 'fresh data' }],
        facts: [{ kind: 'state', key: 'freshness', value: 'ready' }],
      });

      expect(requirement.id).toBe('article');
      expect(requirement.resource).toBe('docs.article');
      expect(isBindingSnapshot(snapshot)).toBe(true);
      expect(snapshot.providerId).toBe('docs.articleProvider');
      expect(snapshot.requirementId).toBe('article');
      expect(snapshot.data?.title).toBe('DX-034');
      expect(Object.isFrozen(snapshot)).toBe(true);
      expect(Object.isFrozen(snapshot.data)).toBe(true);
      expect(Object.isFrozen(snapshot.data?.tags)).toBe(true);
      expect(Object.isFrozen(snapshot.data?.meta)).toBe(true);
      expect(Object.isFrozen(snapshot.issues)).toBe(true);
      expect(Object.isFrozen(snapshot.issues[0])).toBe(true);
      expect(Object.isFrozen(snapshot.facts)).toBe(true);
      expect(Object.isFrozen(snapshot.facts[0])).toBe(true);
      expect(() => {
        m(snapshot.data, 'title', 'mutated');
      }).toThrow(TypeError);
      expect(() => {
        m(snapshot.data?.tags, '1', 'mutable');
      }).toThrow(TypeError);
      expect(() => {
        m(snapshot.issues, '1', {
          severity: 'error',
          code: 'mutation',
          message: 'mutated',
        });
      }).toThrow(TypeError);
    });

  it('freezes an immutable snapshot copy without freezing caller-owned data', () => {
      const article = {
        title: 'DX-034',
        tags: ['binding'],
        meta: { draft: false },
      };
      const snapshot = bindingSnapshot({
        providerId: 'docs.articleProvider',
        requirementId: 'article',
        version: 1,
        status: 'ready',
        data: article,
      });

      expect(snapshot.data).toEqual(article);
      expect(snapshot.data).not.toBe(article);
      expect(snapshot.data?.tags).not.toBe(article.tags);
      expect(snapshot.data?.meta).not.toBe(article.meta);
      expect(Object.isFrozen(snapshot.data)).toBe(true);
      expect(Object.isFrozen(snapshot.data?.tags)).toBe(true);
      expect(Object.isFrozen(snapshot.data?.meta)).toBe(true);
      expect(Object.isFrozen(article)).toBe(false);
      expect(Object.isFrozen(article.tags)).toBe(false);
      expect(Object.isFrozen(article.meta)).toBe(false);

      article.title = 'Mutable source';
      article.tags.push('source-only');
      article.meta.draft = true;

      expect(snapshot.data).toEqual({
        title: 'DX-034',
        tags: ['binding'],
        meta: { draft: false },
      });
    });

  it('rejects mutable built-ins and executable values as snapshot data', () => {
      const base = {
        providerId: 'docs.articleProvider',
        requirementId: 'article',
        version: 1,
        status: 'ready' as const,
      };

      expect(() => bindingSnapshot({
        ...base,
        data: new Map([['title', 'DX-034']]),
      })).toThrow('binding data: unsupported Map at data');
      expect(() => bindingSnapshot({
        ...base,
        data: new Set(['DX-034']),
      })).toThrow('binding data: unsupported Set at data');
      expect(() => bindingSnapshot({
        ...base,
        data: new Date('2026-05-18T00:00:00.000Z'),
      })).toThrow('binding data: unsupported Date at data');
      expect(() => bindingSnapshot({
        ...base,
        data: new Uint8Array([1, 2, 3]),
      })).toThrow('binding data: unsupported Uint8Array at data');
      expect(() => bindingSnapshot({
        ...base,
        data: { load: () => 'provider handle' },
      })).toThrow('binding data: unsupported function at data.load');
    });
});
