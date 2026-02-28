import { describe, it, expect } from 'vitest';
import { group } from './group.js';

describe('group', () => {
  it('collects results from field functions', async () => {
    const result = await group({
      name: async () => 'Alice',
      age: async () => 30,
    });
    expect(result.values.name).toBe('Alice');
    expect(result.values.age).toBe(30);
    expect(result.cancelled).toBe(false);
  });

  it('executes fields in order', async () => {
    const order: string[] = [];
    await group({
      first: async () => { order.push('first'); return 1; },
      second: async () => { order.push('second'); return 2; },
      third: async () => { order.push('third'); return 3; },
    });
    expect(order).toEqual(['first', 'second', 'third']);
  });

  it('handles single field', async () => {
    const result = await group({
      only: async () => 'value',
    });
    expect(result.values.only).toBe('value');
  });

  it('propagates error when a child field rejects (cancellation)', async () => {
    await expect(
      group({
        name: async () => 'Alice',
        age: async () => { throw new Error('cancelled'); },
      }),
    ).rejects.toThrow('cancelled');
  });

  it('does not run subsequent fields after cancellation', async () => {
    const order: string[] = [];
    await expect(
      group({
        first: async () => { order.push('first'); return 1; },
        second: async () => { order.push('second'); throw new Error('cancelled'); },
        third: async () => { order.push('third'); return 3; },
      }),
    ).rejects.toThrow('cancelled');
    expect(order).toEqual(['first', 'second']);
  });
});
