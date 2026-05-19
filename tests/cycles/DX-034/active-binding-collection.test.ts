import { describe, expect, it } from 'vitest';
import {
  activeBindingCollection,
  activeBindingEntry,
  collectActiveBindings,
  commandIntent,
  defineBindingLifecycleOwner,
  defineDataRequirement,
  defineViewData,
  isActiveBindingCollection,
} from '../../../packages/bijou/src/index.js';
import { readRepoFile } from '../repo.js';

const cycle = () => readRepoFile('docs/design/DX-034-declarative-view-data-binding.md');

describe('DX-034F active binding collection', () => {
  it('collects active owner and requirement pairs as immutable public contract objects', () => {
    const owner = defineBindingLifecycleOwner({ id: 'docs.shell', kind: 'app-shell' });
    const article = defineDataRequirement({
      id: 'article',
      resource: 'docs.article',
    });
    const collection = activeBindingCollection([
      activeBindingEntry({
        owner,
        requirement: article,
        providerId: 'docs.articleProvider',
      }),
    ]);

    expect(isActiveBindingCollection(collection)).toBe(true);
    expect(collection.entries().map((entry) => ({
      ownerId: entry.owner.id,
      requirementId: entry.requirement.id,
      providerId: entry.providerId,
    }))).toEqual([
      {
        ownerId: 'docs.shell',
        requirementId: 'article',
        providerId: 'docs.articleProvider',
      },
    ]);
    expect(collection.lifecycleRecords().map((record) => ({
      ownerId: record.owner.id,
      requirementId: record.requirementId,
      providerId: record.providerId,
      state: record.state,
    }))).toEqual([
      {
        ownerId: 'docs.shell',
        requirementId: 'article',
        providerId: 'docs.articleProvider',
        state: 'active',
      },
    ]);
    expect('provider' in collection).toBe(false);
    expect('subscribe' in collection).toBe(false);
    expect('refresh' in collection).toBe(false);
    expect('dispatch' in collection).toBe(false);
    expect('render' in collection).toBe(false);
  });

  it('collects declared view data contracts without command execution or runtime provider work', () => {
    const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
    const article = defineDataRequirement({ id: 'article', resource: 'docs.article' });
    const data = defineViewData({
      requirements: [{ name: 'article', requirement: article }],
    });
    const intent = commandIntent('reader.selectHeading');
    const collection = collectActiveBindings({
      contracts: [{
        owner,
        contract: data,
        providerIds: [{ requirementId: 'article', providerId: 'docs.articleProvider' }],
      }],
    });

    expect(intent.id).toBe('reader.selectHeading');
    expect(collection.get('reader.view', 'article')?.providerId).toBe(
      'docs.articleProvider',
    );
    expect(collection.lifecycleRecords()[0]?.state).toBe('active');
    expect('execute' in intent).toBe(false);
    expect('commands' in collection).toBe(false);
    expect('dispatch' in collection).toBe(false);
  });

  it('documents DX-034F as collection only, not provider runtime integration', () => {
    const section = compact(activeBindingCollectionSection());

    expect(section).toContain('### DX-034F Active Binding Collection');
    expect(section).toContain('DX-034F collects declared active bindings');
    expect(section).toContain('uses `BindingLifecycleOwner`');
    expect(section).toContain('It does not subscribe, refresh, dispatch, render, cache');
    expect(section).toContain('Collection inspects declarations, not rendered output.');
  });

  it('records the public API slice without claiming rendered AppShell or subscriptions', () => {
    const changelog = readRepoFile('docs/CHANGELOG.md');

    expect(changelog).toContain('Active binding collection primitives for `bijou`');
    expect(changelog).toContain('declared data requirements');
    expect(changelog).toContain('explicit lifecycle owners');
    expect(changelog).toContain('active lifecycle records');
    expect(changelog).toContain('without rendering, subscribing, dispatching');
  });
});

function activeBindingCollectionSection(): string {
  const document = cycle();
  const start = document.indexOf('### DX-034F Active Binding Collection');
  const end = document.indexOf('### 5. User Input Emits Commands');

  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);

  return document.slice(start, end);
}

function compact(value: string): string {
  return value.replace(/\s+/g, ' ');
}
