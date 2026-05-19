import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';

const cycle = () => readRepoFile('docs/design/DX-034-declarative-view-data-binding.md');

describe('DX-034D active binding lifecycle', () => {
  it('defines the active hierarchy as the owner of active binding lifetime', () => {
    const section = compact(activeLifecycleSection());

    expect(section).toContain('### DX-034D Active Binding Lifecycle');
    expect(section).toContain('Active hierarchy owns which bindings are active.');
    expect(section).toContain('Providers publish snapshots.');
    expect(section).toContain('Runtime assembles new frames.');
    expect(section).toContain('Views render frames.');
    expect(section).toContain('Commands leave views as intent.');
    expect(section).toContain('Business logic owns change.');
    expect(section).toContain('The active view hierarchy owns binding lifetime.');
  });

  it('keeps lifecycle states small and runtime-owned', () => {
    const section = compact(activeLifecycleSection());

    expect(section).toContain('`active`: the requirement is owned by the active hierarchy');
    expect(section).toContain('`suspended`: the requirement is not currently rendering');
    expect(section).toContain('`disposed`: the requirement ownership is released');
    expect(section).toContain('Views never choose their own binding state.');
    expect(section).toContain('Provider cache retention is provider/runtime policy, not view policy.');
  });

  it('separates provider subscriptions from immutable render frames', () => {
    const section = compact(activeLifecycleSection());

    expect(section).toContain('Provider subscriptions are runtime lifecycle.');
    expect(section).toContain('Binding frames are immutable render inputs.');
    expect(section).toContain('render receives only immutable snapshots assembled into a `BindingFrame`');
    expect(section).toContain('A view never receives provider handles');
    expect(section).toContain('subscription handles');
    expect(section).toContain('refresh methods');
    expect(section).toContain('mutable stores');
    expect(section).toContain('dispatcher callbacks');
  });

  it('defines provider update invalidation without frame mutation', () => {
    const section = compact(activeLifecycleSection());

    expect(section).toContain('Provider updates do not mutate rendered views or existing frames.');
    expect(section).toContain('provider publishes snapshot');
    expect(section).toContain('runtime records binding invalidation');
    expect(section).toContain('runtime assembles next BindingFrame');
    expect(section).toContain('active view renders the next frame');
    expect(section).toContain('Invalidation belongs to runtime binding ownership, not to rendered cells.');
  });

  it('keeps Commands as intent and business logic as the owner of change', () => {
    const section = compact(activeLifecycleSection());

    expect(section).toContain('Commands leave views as intent records.');
    expect(section).toContain('Views may emit declared command intents');
    expect(section).toContain('they do not dispatch business logic');
    expect(section).toContain('Business logic handles Commands, updates state or provider inputs');
    expect(section).toContain('providers eventually publish new snapshots');
  });

  it('keeps rendered AppShell and runtime implementation out of this design slice', () => {
    const section = compact(activeLifecycleSection());

    expect(section).toContain('This slice is design-only.');
    expect(section).toContain('does not implement provider subscriptions');
    expect(section).toContain('active hierarchy traversal');
    expect(section).toContain('command dispatch');
    expect(section).toContain('rendered AppShell');
    expect(section).toContain('schema binding');
    expect(section).toContain('cache retention');
    expect(section).toContain('DOGFOOD integration');
  });
});

function activeLifecycleSection(): string {
  const document = cycle();
  const start = document.indexOf('### DX-034D Active Binding Lifecycle');
  const end = document.indexOf('### 5. User Input Emits Commands');

  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);

  return document.slice(start, end);
}

function compact(value: string): string {
  return value.replace(/\s+/g, ' ');
}
