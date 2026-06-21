import { describe, expect, it } from 'vitest';
import { bindingFrame, bindingSnapshot, commandIntent, defineDataProvider, provide, providerScope } from './binding.js';

function c(target: unknown, args: readonly unknown[]): true {
  if (typeof target !== 'function') throw new Error('target is not callable');
  Reflect.apply(target, undefined, args);
  return true;
}

describe('binding primitives', () => {
  it('rejects duplicate requirements and loose snapshot-shaped objects', () => {
      const first = bindingSnapshot({
        providerId: 'docs.articleProvider',
        requirementId: 'article',
        version: 1,
        status: 'ready',
        data: { title: 'First' },
      });
      const second = bindingSnapshot({
        providerId: 'docs.articleProvider',
        requirementId: 'article',
        version: 2,
        status: 'ready',
        data: { title: 'Second' },
      });

      expect(() => bindingFrame([first, second])).toThrow(
        'binding frame: duplicate requirement id article',
      );
      expect(() => c(bindingFrame, [[{
        providerId: 'docs.articleProvider',
        requirementId: 'article',
        version: 1,
        status: 'ready',
      }]])).toThrow(/bindingSnapshot/);
    });

  it('models provider updates as new frames without mutating the old frame', () => {
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

      expect(firstFrame.require<{ title: string }>('article').title).toBe('First');
      expect(firstFrame.snapshot('article')?.version).toBe(1);
      expect(nextFrame.require<{ title: string }>('article').title).toBe('Second');
      expect(nextFrame.snapshot('article')?.version).toBe(2);
    });

  it('does not expose provider handles, mutable data bags, or refresh backchannels', () => {
      const frame = bindingFrame([
        bindingSnapshot({
          providerId: 'docs.articleProvider',
          requirementId: 'article',
          version: 1,
          status: 'ready',
          data: { title: 'DX-034' },
        }),
      ]);

      expect(Object.keys(frame)).toEqual([]);
      expect('provider' in frame).toBe(false);
      expect('providers' in frame).toBe(false);
      expect('data' in frame).toBe(false);
      expect('refresh' in frame).toBe(false);
      expect('subscribe' in frame).toBe(false);
    });

  it('defines command intents as inspectable metadata, not business logic callbacks', () => {
      const intent = commandIntent<{ headingId: string }>(' reader.selectHeading ', {
        label: 'Select heading',
        description: 'User selected a heading in the reader surface.',
        facts: [{ kind: 'entity', key: 'command', value: 'reader.selectHeading' }],
      });

      expect(intent.id).toBe('reader.selectHeading');
      expect(intent.label).toBe('Select heading');
      expect(Object.isFrozen(intent)).toBe(true);
      expect(Object.isFrozen(intent.facts)).toBe(true);
      expect('execute' in intent).toBe(false);
      expect('handler' in intent).toBe(false);
      expect('dispatch' in intent).toBe(false);
    });

  it('defines inspectable providers and explicit provider scopes without runtime handles', () => {
      const articleProvider = defineDataProvider({
        id: ' docs.articleProvider ',
        resource: ' docs.article ',
        label: 'Articles',
        facts: [{ kind: 'entity', key: 'provider', value: 'docs.articleProvider' }],
      });
      const scope = providerScope([provide(articleProvider)], {
        id: ' appShell.providers ',
        label: 'App shell providers',
        facts: [{ kind: 'entity', key: 'scope', value: 'appShell.providers' }],
      });

      expect(articleProvider.id).toBe('docs.articleProvider');
      expect(articleProvider.resource).toBe('docs.article');
      expect(Object.isFrozen(articleProvider)).toBe(true);
      expect(Object.isFrozen(articleProvider.facts)).toBe(true);
      expect(scope.id).toBe('appShell.providers');
      expect(scope.label).toBe('App shell providers');
      expect(scope.resources()).toEqual(['docs.article']);
      expect(scope.providerIds()).toEqual(['docs.articleProvider']);
      expect(scope.providers()).toEqual([articleProvider]);
      expect(scope.facts).toEqual([
        { kind: 'entity', key: 'scope', value: 'appShell.providers' },
      ]);
      expect(scope.has(' docs.article ')).toBe(true);
      expect(scope.get('docs.article')).toBe(articleProvider);
      expect(Object.isFrozen(scope)).toBe(true);
      expect(Object.isFrozen(scope.resources())).toBe(true);
      expect(Object.isFrozen(scope.providers())).toBe(true);
      expect(Object.isFrozen(scope.providerIds())).toBe(true);
      expect(Object.isFrozen(scope.facts)).toBe(true);
      expect('refresh' in articleProvider).toBe(false);
      expect('subscribe' in articleProvider).toBe(false);
      expect('snapshot' in articleProvider).toBe(false);
      expect('dispatch' in scope).toBe(false);
    });
});
