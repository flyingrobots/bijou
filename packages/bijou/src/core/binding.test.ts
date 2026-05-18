import { describe, expect, it } from 'vitest';
import {
  BindingFrame,
  bindingFrame,
  bindingSnapshot,
  commandIntent,
  defineDataRequirement,
  isBindingSnapshot,
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
});
