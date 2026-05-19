import { describe, expect, it } from 'vitest';
import {
  BindingFrame,
  bindingFrame,
  bindingFrameFromSnapshots,
  bindingSnapshot,
  commandIntent,
  defineDataRequirement,
  defineDataProvider,
  isBindingSnapshot,
  provide,
  providerScope,
  resolveProviderRequirement,
  resolveProviderRequirements,
  type BindingIssue,
  type BindingStatus,
} from './binding.js';

interface Article {
  title: string;
  tags: string[];
  meta: {
    draft: boolean;
  };
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
      (snapshot.data as { title: string }).title = 'mutated';
    }).toThrow(TypeError);
    expect(() => {
      (snapshot.data?.tags as string[]).push('mutable');
    }).toThrow(TypeError);
    expect(() => {
      (snapshot.issues as BindingIssue[]).push({
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

    expect(() => bindingSnapshot({
      providerId: 'docs.articleProvider',
      requirementId: 'article',
      version: 1,
      status: 'loaded' as BindingStatus,
    })).toThrow('binding snapshot: unsupported status loaded');
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
      (frame.require<Article>('article') as { title: string }).title = 'mutated';
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
    expect(() => bindingFrame([{
      providerId: 'docs.articleProvider',
      requirementId: 'article',
      version: 1,
      status: 'ready',
    } as never])).toThrow(
      'binding frame: snapshot at index 0 was not created by bindingSnapshot()',
    );
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
    expect(() => provide({
      id: 'docs.looseProvider',
      resource: 'docs.article',
      facts: [],
    } as never)).toThrow('provider scope: provider was not created by defineDataProvider()');
    expect(() => providerScope([{
      resource: articleProvider.resource,
      provider: articleProvider,
    } as never])).toThrow('provider scope: entry at index 0 was not created by provide()');
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
      (missing.issues as BindingIssue[]).push({
        severity: 'error',
        code: 'mutated',
        message: 'mutated',
      });
    }).toThrow(TypeError);
    expect(() => resolveProviderRequirement({
      id: 'article',
      resource: 'docs.article',
      facts: [],
    } as never, scope)).toThrow(
      'provider resolution: requirement was not created by defineDataRequirement()',
    );
  });

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
    expect(() => bindingFrameFromSnapshots({
      resolutions: [{
        requirementId: 'article',
        resource: 'docs.article',
        optional: false,
        status: 'resolved',
        providerId: 'docs.articleProvider',
        issues: [],
        facts: [],
      } as never],
      snapshots: [],
    })).toThrow('binding frame assembly: resolution at index 0 was not created by resolveProviderRequirement()');
  });
});
