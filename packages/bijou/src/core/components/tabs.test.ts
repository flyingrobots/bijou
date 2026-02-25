import { describe, it, expect } from 'vitest';
import { tabs } from './tabs.js';
import { createTestContext } from '../../adapters/test/index.js';

const items = [
  { label: 'Dashboard' },
  { label: 'Settings' },
  { label: 'Users', badge: '3' },
];

describe('tabs', () => {
  it('renders active tab with bullet in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = tabs(items, { active: 0, ctx });
    expect(result).toContain('● Dashboard');
    expect(result).toContain('Settings');
    expect(result).toContain('Users (3)');
    expect(result).toContain('│');
  });

  it('renders active tab with bullet in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = tabs(items, { active: 1, ctx });
    expect(result).toContain('● Settings');
    expect(result).toContain('Dashboard');
  });

  it('renders bracketed active tab in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = tabs(items, { active: 0, ctx });
    expect(result).toBe('[Dashboard] | Settings | Users (3)');
  });

  it('renders descriptive labels in accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const result = tabs(items, { active: 1, ctx });
    expect(result).toContain('Tab 1 of 3: Dashboard');
    expect(result).toContain('Tab 2 of 3: Settings (active)');
    expect(result).toContain('Tab 3 of 3: Users (3)');
  });

  it('supports custom separator', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = tabs(items, { active: 0, separator: ' ~ ', ctx });
    expect(result).toBe('[Dashboard] ~ Settings ~ Users (3)');
  });

  it('handles single item', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = tabs([{ label: 'Only' }], { active: 0, ctx });
    expect(result).toBe('[Only]');
  });

  it('renders badge in parens', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = tabs([{ label: 'Mail', badge: '12' }], { active: 0, ctx });
    expect(result).toContain('Mail (12)');
  });
});
