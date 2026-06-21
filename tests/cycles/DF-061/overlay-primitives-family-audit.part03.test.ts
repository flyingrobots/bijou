import { afterEach, describe, expect, it } from 'vitest';
import { _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';

import { readRepoFile } from '../repo.js';

describe('DF-061 overlay primitives family audit', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('keeps component-family guidance aligned with overlay primitive truth', () => {
    const families = readRepoFile('docs/design-system/component-families.md');
    expect(families).toContain('### Overlay primitives');
    expect(families).toContain('- `tooltip()`');
    expect(families).toContain('- `drawer()`');
    expect(families).toContain('- `modal()`');
    expect(families).toContain('- `toast()`');
    expect(families).toContain('explanatory');
    expect(families).toContain('supplemental');
    expect(families).toContain('blocking');
    expect(families).toContain('transient');
    expect(families).toContain('prefer `drawer()` over `modal()`');
    expect(families).toContain('stop composing ad hoc `toast()` overlays and move up to the notification system');
    expect(families).toContain('pipe: lower to plain text event or prompt surfaces');
    expect(families).toContain('accessible: linearize overlay content');
  });
});
