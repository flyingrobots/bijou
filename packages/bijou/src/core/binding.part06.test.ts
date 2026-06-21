import { describe, expect, it } from 'vitest';
import { defineDataRequirement, defineViewData } from './binding.js';

function c(target: unknown, args: readonly unknown[]): true {
  if (typeof target !== 'function') throw new Error('target is not callable');
  Reflect.apply(target, undefined, args);
  return true;
}

describe('binding primitives', () => {
  it('defines immutable named view data contracts without provider handles', () => {
      const article = defineDataRequirement({
        id: 'article',
        resource: 'docs.article',
      });
      const outline = defineDataRequirement({
        id: 'outline',
        resource: 'docs.outline',
        optional: true,
      });
      const data = defineViewData({
        id: ' reader.data ',
        requirements: [
          { name: ' article ', requirement: article },
          { name: 'outline', requirement: outline },
        ],
        facts: [{ kind: 'entity', key: 'viewData', value: 'reader.data' }],
      });

      expect(data.id).toBe('reader.data');
      expect(data.names()).toEqual(['article', 'outline']);
      expect(data.requirementIds()).toEqual(['article', 'outline']);
      expect(data.requirement(' article ')).toBe(article);
      expect(data.requirement('outline')).toBe(outline);
      expect(data.entry('article')).toEqual({
        name: 'article',
        requirement: article,
      });
      expect(Object.isFrozen(data)).toBe(true);
      expect(Object.isFrozen(data.names())).toBe(true);
      expect(Object.isFrozen(data.requirements())).toBe(true);
      expect(Object.isFrozen(data.facts)).toBe(true);
      expect('provider' in data).toBe(false);
      expect('refresh' in data).toBe(false);
      expect('subscribe' in data).toBe(false);
    });

  it('rejects ambiguous or loose view data requirements', () => {
      const article = defineDataRequirement({
        id: 'article',
        resource: 'docs.article',
      });
      const articleAgain = defineDataRequirement({
        id: 'article',
        resource: 'docs.article.v2',
      });
      const comments = defineDataRequirement({
        id: 'comments',
        resource: 'docs.comments',
      });

      expect(() => defineViewData({
        requirements: [
          { name: 'content', requirement: article },
          { name: 'content', requirement: comments },
        ],
      })).toThrow('view data: duplicate requirement name content');
      expect(() => defineViewData({
        requirements: [
          { name: 'article', requirement: article },
          { name: 'articleAgain', requirement: articleAgain },
        ],
      })).toThrow('view data: duplicate requirement id article');
      expect(() => c(defineViewData, [{
        requirements: [
          {
            name: 'article',
            requirement: {
              id: 'article',
              resource: 'docs.article',
              facts: [],
            },
          },
        ],
      }])).toThrow(/defineDataRequirement/);
    });
});
