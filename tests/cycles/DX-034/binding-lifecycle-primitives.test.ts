import { describe, expect, it } from 'vitest';
import {
  activateBinding,
  bindingLifecycleRecord,
  commandIntent,
  defineBindingLifecycleOwner,
  disposeBinding,
  invalidateBinding,
  isBindingLifecycleRecord,
  suspendBinding,
} from '../../../packages/bijou/src/index.js';
import { readRepoFile } from '../repo.js';

const cycle = () => readRepoFile('docs/design/DX-034-declarative-view-data-binding.md');

describe('DX-034E binding lifecycle primitives', () => {
  it('models active, suspended, disposed, and invalidated lifecycle facts through the public API', () => {
    const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
    const active = bindingLifecycleRecord({
      owner,
      requirementId: 'article',
      providerId: 'docs.articleProvider',
    });
    const suspended = suspendBinding(active);
    const reactivated = activateBinding(suspended);
    const invalidated = invalidateBinding(reactivated, {
      reason: 'provider-update',
      snapshotVersion: 2,
    });
    const disposed = disposeBinding(invalidated);

    expect(isBindingLifecycleRecord(active)).toBe(true);
    expect(active.state).toBe('active');
    expect(suspended.state).toBe('suspended');
    expect(reactivated.state).toBe('active');
    expect(invalidated.invalidations).toEqual([
      {
        requirementId: 'article',
        providerId: 'docs.articleProvider',
        reason: 'provider-update',
        snapshotVersion: 2,
      },
    ]);
    expect(disposed.state).toBe('disposed');
    expect(() => activateBinding(disposed)).toThrow(
      'binding lifecycle: disposed binding article cannot activate',
    );
    expect('provider' in invalidated).toBe(false);
    expect('subscribe' in invalidated).toBe(false);
    expect('refresh' in invalidated).toBe(false);
    expect('dispatch' in invalidated).toBe(false);
  });

  it('keeps command intent metadata separate from lifecycle transitions', () => {
    const intent = commandIntent<{ articleId: string }>('docs.openArticle');
    const lifecycle = bindingLifecycleRecord({
      owner: defineBindingLifecycleOwner({ id: 'docs.shell', kind: 'app-shell' }),
      requirementId: 'article',
    });

    expect(intent.id).toBe('docs.openArticle');
    expect('execute' in intent).toBe(false);
    expect('dispatch' in intent).toBe(false);
    expect('commands' in lifecycle).toBe(false);
    expect('dispatch' in lifecycle).toBe(false);
  });

  it('documents DX-034E as transition algebra, not runtime management', () => {
    const section = compact(bindingLifecyclePrimitivesSection());

    expect(section).toContain('### DX-034E Binding Lifecycle Primitives');
    expect(section).toContain('DX-034E implements lifecycle as transition algebra');
    expect(section).toContain('answer what state a binding is in, who owns it');
    expect(section).toContain('They do not subscribe, refresh, dispatch, traverse the active view tree');
    expect(section).toContain('`active`, `suspended`, and `disposed`');
    expect(section).toContain('Provider updates create invalidation records');
    expect(section).toContain('Lifecycle records are immutable facts, not managers.');
  });

  it('records the public API slice without claiming runtime lifecycle implementation', () => {
    const changelog = readRepoFile('docs/CHANGELOG.md');

    expect(changelog).toContain('Binding lifecycle primitives for `bijou`');
    expect(changelog).toContain('lifecycle owners');
    expect(changelog).toContain('immutable lifecycle records');
    expect(changelog).toContain('provider subscriptions');
    expect(changelog).toContain('remain follow-on work');
  });
});

function bindingLifecyclePrimitivesSection(): string {
  const document = cycle();
  const start = document.indexOf('### DX-034E Binding Lifecycle Primitives');
  const end = document.indexOf('### 5. User Input Emits Commands');

  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);

  return document.slice(start, end);
}

function compact(value: string): string {
  return value.replace(/\s+/g, ' ');
}
