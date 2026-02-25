import { describe, it, expect } from 'vitest';
import { tree } from './tree.js';
import { createTestContext } from '../../adapters/test/index.js';

const simple: Parameters<typeof tree>[0] = [
  { label: 'src', children: [{ label: 'index.ts' }, { label: 'utils.ts' }] },
  { label: 'README.md' },
];

describe('tree', () => {
  it('renders box-drawing connectors in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = tree(simple, { ctx });
    expect(result).toContain('├─ src');
    expect(result).toContain('│  ├─ index.ts');
    expect(result).toContain('│  └─ utils.ts');
    expect(result).toContain('└─ README.md');
  });

  it('renders box-drawing connectors in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = tree(simple, { ctx });
    expect(result).toContain('├─ src');
    expect(result).toContain('└─ README.md');
  });

  it('renders indented plain text in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = tree(simple, { ctx });
    expect(result).toBe('src\n  index.ts\n  utils.ts\nREADME.md');
  });

  it('renders indented text with item counts in accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const result = tree(simple, { ctx });
    expect(result).toContain('src (contains 2 items)');
    expect(result).toContain('  index.ts');
    expect(result).toContain('  utils.ts');
    expect(result).toContain('README.md');
  });

  it('handles deeply nested trees', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const deep = [{ label: 'a', children: [{ label: 'b', children: [{ label: 'c' }] }] }];
    const result = tree(deep, { ctx });
    expect(result).toContain('└─ a');
    expect(result).toContain('└─ b');
    expect(result).toContain('└─ c');
  });

  it('handles empty array', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(tree([], { ctx })).toBe('');
  });

  it('handles single node with no children', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = tree([{ label: 'only' }], { ctx });
    expect(result).toBe('└─ only');
  });
});
